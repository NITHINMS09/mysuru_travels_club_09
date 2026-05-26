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
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const updateData: any = { ...data };

    if (data.itinerary) updateData.itinerary = typeof data.itinerary === 'object' ? JSON.stringify(data.itinerary) : data.itinerary;
    if (data.pickupPoints) updateData.pickupPoints = typeof data.pickupPoints === 'object' ? JSON.stringify(data.pickupPoints) : data.pickupPoints;
    if (data.included) updateData.included = Array.isArray(data.included) ? data.included.join(',') : data.included;
    if (data.excluded) updateData.excluded = Array.isArray(data.excluded) ? data.excluded.join(',') : data.excluded;
    if (data.images) updateData.images = Array.isArray(data.images) ? data.images.join(',') : data.images;

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(trip);
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

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
