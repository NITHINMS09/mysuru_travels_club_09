import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET all trips (public)
router.get('/', async (req, res) => {
  try {
    const { status, featured, category, search, page = '1', limit = '12' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = {};

    if (status) where.status = status;
    if (featured === 'true') where.featured = true;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { destination: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { startDate: 'asc' },
        include: {
          _count: { select: { reviews: true, bookings: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    // Calculate average rating for each trip
    const tripsWithRating = await Promise.all(
      trips.map(async (trip) => {
        const avgRating = await prisma.review.aggregate({
          where: { tripId: trip.id },
          _avg: { rating: true },
        });
        return { ...trip, avgRating: avgRating._avg.rating || 0 };
      })
    );

    const formattedTrips = tripsWithRating.map(trip => ({
      ...trip,
      images: typeof trip.images === 'string' ? trip.images.split(',') : trip.images,
      included: typeof trip.included === 'string' ? trip.included.split(',') : trip.included,
      excluded: typeof trip.excluded === 'string' ? trip.excluded.split(',') : trip.excluded,
      itinerary: typeof trip.itinerary === 'string' ? JSON.parse(trip.itinerary) : trip.itinerary,
      pickupPoints: typeof trip.pickupPoints === 'string' ? JSON.parse(trip.pickupPoints) : trip.pickupPoints,
    }));

    res.json({
      trips: formattedTrips,
      pagination: {
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single trip (public)
router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: {
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const avgRating = await prisma.review.aggregate({
      where: { tripId: trip.id },
      _avg: { rating: true },
    });

    const formattedTrip = {
      ...trip,
      images: typeof trip.images === 'string' ? trip.images.split(',') : trip.images,
      included: typeof trip.included === 'string' ? trip.included.split(',') : trip.included,
      excluded: typeof trip.excluded === 'string' ? trip.excluded.split(',') : trip.excluded,
      itinerary: typeof trip.itinerary === 'string' ? JSON.parse(trip.itinerary) : trip.itinerary,
      pickupPoints: typeof trip.pickupPoints === 'string' ? JSON.parse(trip.pickupPoints) : trip.pickupPoints,
      avgRating: avgRating._avg.rating || 0
    };

    res.json(formattedTrip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE trip (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const trip = await prisma.trip.create({
      data: {
        ...data,
        slug: `${slug}-${Date.now()}`,
        itinerary: typeof data.itinerary === 'object' ? JSON.stringify(data.itinerary) : data.itinerary,
        pickupPoints: typeof data.pickupPoints === 'object' ? JSON.stringify(data.pickupPoints) : data.pickupPoints,
        included: Array.isArray(data.included) ? data.included.join(',') : data.included,
        excluded: Array.isArray(data.excluded) ? data.excluded.join(',') : data.excluded,
        images: Array.isArray(data.images) ? data.images.join(',') : data.images,
      },
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE trip (admin)
const updateTripHandler = async (req: AuthRequest, res: any) => {
  try {
    const {
      id,
      createdAt,
      updatedAt,
      bookings,
      reviews,
      _count,
      avgRating,
      ...allowedData
    } = req.body;

    // Validate fields if provided
    if (allowedData.title !== undefined && (!allowedData.title || !allowedData.title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    if (allowedData.destination !== undefined && (!allowedData.destination || !allowedData.destination.trim())) {
      return res.status(400).json({ error: 'Destination cannot be empty' });
    }
    if (allowedData.price !== undefined) {
      const priceNum = parseFloat(allowedData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ error: 'Price must be a valid number greater than 0' });
      }
      allowedData.price = priceNum;
    }
    if (allowedData.totalSeats !== undefined) {
      const seatsNum = parseInt(allowedData.totalSeats);
      if (isNaN(seatsNum) || seatsNum <= 0) {
        return res.status(400).json({ error: 'Total seats must be a valid number greater than 0' });
      }
      allowedData.totalSeats = seatsNum;
    }
    if (allowedData.startDate !== undefined) {
      const start = new Date(allowedData.startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: 'Invalid start date' });
      }
      allowedData.startDate = start;
    }
    if (allowedData.endDate !== undefined) {
      const end = new Date(allowedData.endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid end date' });
      }
      allowedData.endDate = end;
    }
    if (allowedData.startDate && allowedData.endDate && new Date(allowedData.endDate) < new Date(allowedData.startDate)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }
    if (allowedData.coverImage !== undefined && (!allowedData.coverImage || !allowedData.coverImage.trim())) {
      return res.status(400).json({ error: 'Cover image URL cannot be empty' });
    }

    if (allowedData.latitude !== undefined && allowedData.latitude !== null) {
      allowedData.latitude = parseFloat(allowedData.latitude);
      if (isNaN(allowedData.latitude)) allowedData.latitude = null;
    }
    if (allowedData.longitude !== undefined && allowedData.longitude !== null) {
      allowedData.longitude = parseFloat(allowedData.longitude);
      if (isNaN(allowedData.longitude)) allowedData.longitude = null;
    }

    if (allowedData.itinerary !== undefined) {
      allowedData.itinerary = typeof allowedData.itinerary === 'object' ? JSON.stringify(allowedData.itinerary) : allowedData.itinerary;
    }
    if (allowedData.pickupPoints !== undefined) {
      allowedData.pickupPoints = typeof allowedData.pickupPoints === 'object' ? JSON.stringify(allowedData.pickupPoints) : allowedData.pickupPoints;
    }
    if (allowedData.included !== undefined) {
      allowedData.included = Array.isArray(allowedData.included) ? allowedData.included.join(',') : allowedData.included;
    }
    if (allowedData.excluded !== undefined) {
      allowedData.excluded = Array.isArray(allowedData.excluded) ? allowedData.excluded.join(',') : allowedData.excluded;
    }
    if (allowedData.images !== undefined) {
      allowedData.images = Array.isArray(allowedData.images) ? allowedData.images.join(',') : allowedData.images;
    }

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: allowedData,
    });
    res.json(trip);
  } catch (error: any) {
    console.error('Update trip error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

router.put('/:id', authenticateAdmin, updateTripHandler);
router.patch('/:id', authenticateAdmin, updateTripHandler);

// DELETE trip (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
