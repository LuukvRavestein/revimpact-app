import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check if user is super admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authenticated' 
      }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase() || '';
    const isAdminUser = userEmail === 'luuk@revimpact.nl' || 
                       userEmail === 'admin@revimpact.nl';

    if (!isAdminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authorized - only super admins can view all users' 
      }, { status: 403 });
    }

    // Get all workspace members with their user data
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        user_email,
        user_name,
        workspaces (
          id,
          name
        )
      `);

    if (membersError) {
      console.error('Error fetching workspace members:', membersError);
      return NextResponse.json({ 
        success: false, 
        message: `Error fetching members: ${membersError.message}` 
      }, { status: 500 });
    }

    // Get unique user IDs
    const userIds = [...new Set(members?.map(m => m.user_id) || [])];
    
    // Fetch user details from auth.users using admin API
    const userDetails = [];
    for (const userId of userIds) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error(`Error fetching user ${userId}:`, userError);
          // Add placeholder data for users we can't fetch
          userDetails.push({
            id: userId,
            email: 'User data not accessible',
            created_at: 'N/A',
            last_sign_in_at: null,
            full_name: 'Unknown User'
          });
        } else {
          userDetails.push({
            id: userId,
            email: userData.user.email || 'No email',
            created_at: userData.user.created_at || 'N/A',
            last_sign_in_at: userData.user.last_sign_in_at || null,
            full_name: userData.user.user_metadata?.full_name || 'No name'
          });
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        userDetails.push({
          id: userId,
          email: 'User data not accessible',
          created_at: 'N/A',
          last_sign_in_at: null,
          full_name: 'Unknown User'
        });
      }
    }

    // Format workspace members with user data
    const formattedMembers = members?.map(member => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      created_at: member.created_at,
      user_email: member.user_email || 'No email',
      user_name: member.user_name || 'No name',
      workspace: member.workspaces?.name || 'Unknown Workspace'
    })) || [];

    return NextResponse.json({ 
      success: true, 
      users: userDetails,
      workspaceMembers: formattedMembers
    });

  } catch (error) {
    console.error('Unexpected error in get-all-users:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Unexpected error: ${error}` 
    }, { status: 500 });
  }
}
