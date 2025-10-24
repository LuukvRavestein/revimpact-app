import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid user IDs' 
      }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase() || '';
    const isAdminUser = userEmail.includes('admin') || 
                       userEmail === 'luuk@revimpact.nl' || 
                       userEmail === 'admin@revimpact.nl';

    if (!isAdminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authorized' 
      }, { status: 403 });
    }

    // Get user details using admin API
    const userDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
          
          if (error || !userData?.user) {
            return {
              id: userId,
              email: 'Unknown User',
              name: 'Unknown User'
            };
          }

          return {
            id: userId,
            email: userData.user.email || 'Unknown User',
            name: userData.user.user_metadata?.full_name || 
                  userData.user.email?.split('@')[0] || 
                  'Unknown User'
          };
        } catch (err) {
          console.error('Error fetching user:', userId, err);
          return {
            id: userId,
            email: 'Unknown User',
            name: 'Unknown User'
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      users: userDetails 
    });

  } catch (error) {
    console.error('Error in get-user-details API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
