import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/locations/route'
import { createClient } from '@supabase/supabase-js'
import { pipeline } from '@xenova/transformers'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}))

describe('/api/locations', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  }

  const mockPipeline = pipeline as jest.MockedFunction<typeof pipeline>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  describe('GET /api/locations', () => {
    it('should return all locations when no category is specified', async () => {
      const mockLocations = [
        { id: 1, title: 'Location 1', category: 'mountain' },
        { id: 2, title: 'Location 2', category: 'beach' },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      ;(mockQuery as any).then = jest.fn().mockResolvedValue({
        data: mockLocations,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/locations')
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(data).toEqual(mockLocations)
      expect(response.status).toBe(200)
    })

    it('should filter locations by category when specified', async () => {
      const mockLocations = [
        { id: 1, title: 'Location 1', category: 'mountain' },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      ;(mockQuery as any).then = jest.fn().mockResolvedValue({
        data: mockLocations,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/locations?category=mountain')
      const response = await GET(request)
      const data = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'mountain')
      expect(data).toEqual(mockLocations)
    })

    it('should not filter when category is "all"', async () => {
      const mockLocations = [
        { id: 1, title: 'Location 1', category: 'mountain' },
        { id: 2, title: 'Location 2', category: 'beach' },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      ;(mockQuery as any).then = jest.fn().mockResolvedValue({
        data: mockLocations,
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/locations?category=all')
      const response = await GET(request)

      expect(mockQuery.eq).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      mockSupabase.from.mockReturnValue(mockQuery)
      ;(mockQuery as any).then = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const request = new NextRequest('http://localhost:3000/api/locations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Database error' })
    })
  })

  describe('POST /api/locations', () => {
    const mockLocationData = {
      title: 'Test Location',
      category: 'mountain',
      text: 'Test description',
      latitude: 35.6762,
      longitude: 139.6503,
      image_urls: ['https://example.com/image.jpg'],
    }

    it('should create a new location successfully', async () => {
      const mockExtractor = jest.fn().mockResolvedValue({
        data: new Float32Array([0.1, 0.2, 0.3]),
      })
      mockPipeline.mockResolvedValue(mockExtractor)

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, ...mockLocationData }],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockInsertQuery)

      const request = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify(mockLocationData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(mockPipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      expect(mockExtractor).toHaveBeenCalledWith(mockLocationData.text, { pooling: 'mean', normalize: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockInsertQuery.insert).toHaveBeenCalledWith([
        {
          title: mockLocationData.title,
          category: mockLocationData.category,
          description: mockLocationData.text,
          latitude: mockLocationData.latitude,
          longitude: mockLocationData.longitude,
          embedding: [0.1, 0.2, 0.3],
          image_urls: mockLocationData.image_urls,
        },
      ])
      expect(response.status).toBe(200)
      expect(data).toEqual({ data: [{ id: 1, ...mockLocationData }] })
    })

    it('should handle pipeline errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Pipeline error'))

      const request = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify(mockLocationData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Pipeline error' })
    })

    it('should handle database insertion errors', async () => {
      const mockExtractor = jest.fn().mockResolvedValue({
        data: new Float32Array([0.1, 0.2, 0.3]),
      })
      mockPipeline.mockResolvedValue(mockExtractor)

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database insertion error' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockInsertQuery)

      const request = new NextRequest('http://localhost:3000/api/locations', {
        method: 'POST',
        body: JSON.stringify(mockLocationData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Database insertion error' })
    })
  })
})