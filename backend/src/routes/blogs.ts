import { Router } from 'express';
import prisma from '../config/database';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// GET all blogs (public)
router.get('/', async (req, res) => {
  try {
    const { tag, page = '1', limit = '9' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const where: any = { published: true };
    if (tag) where.tags = { contains: tag as string };

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' } }),
      prisma.blog.count({ where }),
    ]);
    const formattedBlogs = blogs.map(blog => ({
      ...blog,
      tags: typeof blog.tags === 'string' ? blog.tags.split(',') : blog.tags
    }));
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
    res.json({ blogs: formattedBlogs, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single blog (public)
router.get('/:slug', async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug } });
    if (!blog) { res.status(404).json({ error: 'Blog not found' }); return; }
    await prisma.blog.update({ where: { id: blog.id }, data: { views: { increment: 1 } } });
    const formattedBlog = {
      ...blog,
      tags: typeof blog.tags === 'string' ? blog.tags.split(',') : blog.tags
    };
    res.json(formattedBlog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE blog (admin)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const data = req.body;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const blog = await prisma.blog.create({ 
      data: { 
        ...data, 
        slug,
        tags: Array.isArray(data.tags) ? data.tags.join(',') : data.tags
      } 
    });
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE blog (admin)
router.put('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const blog = await prisma.blog.update({ where: { id: req.params.id }, data: req.body });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE blog (admin)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
