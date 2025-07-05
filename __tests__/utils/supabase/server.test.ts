import { createClient } from '@/app/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Supabase Server', () => {
  const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
  const mockCookies = cookies as jest.MockedFunction<typeof cookies>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  it('should create a server client with correct parameters', () => {
    const mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    
    const mockClient = {
      from: jest.fn(),
      auth: jest.fn(),
    }
    
    mockCreateServerClient.mockReturnValue(mockClient as any)

    const client = createClient()

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    )
    expect(client).toBe(mockClient)
  })

  it('should handle cookie get operations', () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: 'test-cookie-value' }),
      set: jest.fn(),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    mockCreateServerClient.mockReturnValue({} as any)

    createClient()

    const cookieConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2]
    const result = cookieConfig.cookies.get('test-cookie')

    expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie')
    expect(result).toBe('test-cookie-value')
  })

  it('should handle cookie set operations', () => {
    const mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    mockCreateServerClient.mockReturnValue({} as any)

    createClient()

    const cookieConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2]
    cookieConfig.cookies.set('test-cookie', 'test-value', { path: '/' })

    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: 'test-cookie',
      value: 'test-value',
      path: '/',
    })
  })

  it('should handle cookie set errors gracefully', () => {
    const mockCookieStore = {
      get: jest.fn(),
      set: jest.fn().mockImplementation(() => {
        throw new Error('Server Component error')
      }),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    mockCreateServerClient.mockReturnValue({} as any)

    createClient()

    const cookieConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2]
    
    expect(() => {
      cookieConfig.cookies.set('test-cookie', 'test-value', { path: '/' })
    }).not.toThrow()
  })

  it('should handle cookie remove operations', () => {
    const mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    mockCreateServerClient.mockReturnValue({} as any)

    createClient()

    const cookieConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2]
    cookieConfig.cookies.remove('test-cookie', { path: '/' })

    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: 'test-cookie',
      value: '',
      path: '/',
    })
  })

  it('should handle cookie remove errors gracefully', () => {
    const mockCookieStore = {
      get: jest.fn(),
      set: jest.fn().mockImplementation(() => {
        throw new Error('Server Component error')
      }),
    }
    
    mockCookies.mockReturnValue(mockCookieStore as any)
    mockCreateServerClient.mockReturnValue({} as any)

    createClient()

    const cookieConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2]
    
    expect(() => {
      cookieConfig.cookies.remove('test-cookie', { path: '/' })
    }).not.toThrow()
  })
})