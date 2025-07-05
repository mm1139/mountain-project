import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/locations/[id]/route'
import { createClient } from '@supabase/supabase-js'
import { pipeline } from '@xenova/transformers'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}))

describe('/api/locations/[id]', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
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

  describe('GET /api/locations/[id]', () => {
    it('should return a single location by id', async () => {
      const mockLocation = {
        id: 1,
        title: 'Test Location',
        category: 'mountain',
        description: 'Test description',
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLocation,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(data).toEqual(mockLocation)
      expect(response.status).toBe(200)
    })

    it('should handle database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Location not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Location not found' })
    })
  })

  describe('PUT /api/locations/[id]', () => {
    const mockLocationData = {
      title: 'Updated Location',
      category: 'beach',
      text: 'Updated description',
      latitude: 35.6762,
      longitude: 139.6503,
      image_urls: ['https://example.com/updated.jpg'],
    }

    it('should update a location successfully', async () => {
      const mockExtractor = jest.fn().mockResolvedValue({
        data: new Float32Array([0.4, 0.5, 0.6]),
      })
      mockPipeline.mockResolvedValue(mockExtractor)

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [{ id: 1, ...mockLocationData }],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1', {
        method: 'PUT',
        body: JSON.stringify(mockLocationData),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(mockPipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      expect(mockExtractor).toHaveBeenCalledWith(mockLocationData.text, { pooling: 'mean', normalize: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        title: mockLocationData.title,
        category: mockLocationData.category,
        description: mockLocationData.text,
        latitude: mockLocationData.latitude,
        longitude: mockLocationData.longitude,
        embedding: [0.4, 0.5, 0.6],
        image_urls: mockLocationData.image_urls,
      })
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(response.status).toBe(200)
      expect(data).toEqual({ data: [{ id: 1, ...mockLocationData }] })
    })

    it('should handle pipeline errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Pipeline error'))

      const request = new NextRequest('http://localhost:3000/api/locations/1', {
        method: 'PUT',
        body: JSON.stringify(mockLocationData),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Pipeline error' })
    })

    it('should handle database update errors', async () => {
      const mockExtractor = jest.fn().mockResolvedValue({
        data: new Float32Array([0.4, 0.5, 0.6]),
      })
      mockPipeline.mockResolvedValue(mockExtractor)

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockUpdateQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1', {
        method: 'PUT',
        body: JSON.stringify(mockLocationData),
      })

      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Update failed' })
    })
  })

  describe('DELETE /api/locations/[id]', () => {
    it('should delete a location successfully', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockDeleteQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(mockSupabase.from).toHaveBeenCalledWith('locations')
      expect(mockDeleteQuery.delete).toHaveBeenCalled()
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', '1')
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle database deletion errors', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Deletion failed' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockDeleteQuery)

      const request = new NextRequest('http://localhost:3000/api/locations/1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Deletion failed' })
    })
  })
})