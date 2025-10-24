import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();
    console.log('get-user-details API called with userIds:', userIds);
    
    if (!userIds || !Array.isArray(userIds)) {
      console.log('Invalid userIds provided');
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

    console.log('User email:', userEmail, 'Is admin:', isAdminUser);

    if (!isAdminUser) {
      console.log('User not authorized');
      return NextResponse.json({ 
        success: false, 
        message: 'Not authorized' 
      }, { status: 403 });
    }

    // Get user details using admin API
    console.log('Fetching user details for userIds:', userIds);
    const userDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          console.log('Fetching user:', userId);
          
          // Try to get user from auth.users table directly
          const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, raw_user_meta_data')
            .eq('id', userId)
            .single();
          
          console.log('Auth users query result:', authUsers, 'Error:', authError);
          
          if (authUsers && !authError) {
            const result = {
              id: userId,
              email: authUsers.email || 'Unknown User',
              name: authUsers.raw_user_meta_data?.full_name || 
                    authUsers.email?.split('@')[0] || 
                    'Unknown User'
            };
            
            console.log('Returning user data from auth.users:', result);
            return result;
          }
          
          // Fallback to admin API
          const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
          
          console.log('Admin API result for', userId, ':', userData, 'Error:', error);
          
          if (error || !userData?.user) {
            console.log('No user data found for:', userId);
            return {
              id: userId,
              email: 'Unknown User',
              name: 'Unknown User'
            };
          }

          const result = {
            id: userId,
            email: userData.user.email || 'Unknown User',
            name: userData.user.user_metadata?.full_name || 
                  userData.user.email?.split('@')[0] || 
                  'Unknown User'
          };
          
          console.log('Returning user data from admin API:', result);
          return result;
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
