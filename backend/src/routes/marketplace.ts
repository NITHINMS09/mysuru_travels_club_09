import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { getCache, setCache, clearCache } from '../utils/cache';
import { deleteAssetFromUrl } from '../utils/cloudinary';

const router = Router();

// GET all marketplace listings with filtering
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, query, isAvailable, limit = '50', page = '1' } = req.query;
    
    const cacheKey = `marketplace:list:${JSON.stringify(req.query)}`;
    const cachedData = getCache<any>(cacheKey);
    if (cachedData) {
      res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
      return res.json(cachedData);
    }

    const where: any = {};
    if (category) where.category = category;
    if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice as string) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice as string) };
    if (query) {
      where.OR = [
        { title: { contains: query as string } },
        { location: { contains: query as string } },
        { description: { contains: query as string } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const listings = await prisma.marketplaceListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string)
    });

    const total = await prisma.marketplaceListing.count({ where });

    // Parse JSON fields
    const formattedListings = listings.map(listing => ({
      ...listing,
      gallery: JSON.parse(listing.gallery || '[]'),
      amenities: JSON.parse(listing.amenities || '[]')
    }));

    const responseData = {
      listings: formattedListings,
      pagination: {
        total,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    };

    setCache(cacheKey, responseData, 120000); // 2 minutes cache

    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    res.json(responseData);
  } catch (error) {
    console.error('Fetch marketplace error:', error);
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

// GET single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: req.params.id }
    });

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    res.json({
      ...listing,
      gallery: JSON.parse(listing.gallery || '[]'),
      amenities: JSON.parse(listing.amenities || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching listing' });
  }
});

// POST new listing (Admin only)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const {
      category, title, description, price, priceUnit, location, coverImage, gallery, amenities, isAvailable, rating
    } = req.body;

    const listing = await prisma.marketplaceListing.create({
      data: {
        category,
        title,
        description,
        price: parseFloat(price),
        priceUnit,
        location,
        coverImage,
        gallery: JSON.stringify(gallery || []),
        amenities: JSON.stringify(amenities || []),
        isAvailable: isAvailable ?? true,
        rating: rating ?? 5.0
      }
    });

    clearCache('marketplace:');
    res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});

// PUT update listing (Admin only)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { gallery, amenities, ...updateData } = req.body;
    
    if (gallery) updateData.gallery = JSON.stringify(gallery);
    if (amenities) updateData.amenities = JSON.stringify(amenities);
    if (updateData.price) updateData.price = parseFloat(updateData.price);

    const listing = await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: updateData
    });

    clearCache('marketplace:');
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating listing' });
  }
});

// DELETE listing (Admin only)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const listing = await prisma.marketplaceListing.findUnique({ where: { id: req.params.id } });
    if (listing) {
      if (listing.coverImage) {
        await deleteAssetFromUrl(listing.coverImage);
      }
      if (listing.gallery) {
        try {
          const imageUrls = JSON.parse(listing.gallery);
          if (Array.isArray(imageUrls)) {
            for (const url of imageUrls) {
              if (url) {
                await deleteAssetFromUrl(url.trim());
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse marketplace gallery URLs:', e);
        }
      }
    }

    await prisma.marketplaceListing.delete({
      where: { id: req.params.id }
    });
    clearCache('marketplace:');
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting listing' });
  }
});

export default router;
