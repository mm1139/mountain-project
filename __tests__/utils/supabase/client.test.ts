import { createClient } from '@/app/utils/supabase/client'
import { createBrowserClient } from '@supabase/ssr'

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}))

describe('Supabase Client', () => {
  const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>

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

  it('should create a browser client with correct parameters', () => {
    const mockClient = {
      from: jest.fn(),
      auth: jest.fn(),
    }
    
    mockCreateBrowserClient.mockReturnValue(mockClient as any)

    const client = createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
    expect(client).toBe(mockClient)
  })

  it('should use environment variables for configuration', () => {
    const mockClient = {
      from: jest.fn(),
      auth: jest.fn(),
    }
    
    mockCreateBrowserClient.mockReturnValue(mockClient as any)

    createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  })

  it('should create a new client instance on each call', () => {
    const mockClient1 = { id: 1 }
    const mockClient2 = { id: 2 }
    
    mockCreateBrowserClient
      .mockReturnValueOnce(mockClient1 as any)
      .mockReturnValueOnce(mockClient2 as any)

    const client1 = createClient()
    const client2 = createClient()

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2)
    expect(client1).toBe(mockClient1)
    expect(client2).toBe(mockClient2)
  })
})