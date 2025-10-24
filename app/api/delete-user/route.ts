import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId, memberId } = await request.json();
    
    if (!userId || !memberId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
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
    const isAdminUser = userEmail === 'luuk@revimpact.nl' || 
                       userEmail === 'admin@revimpact.nl';

    if (!isAdminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authorized - only super admins can delete users' 
      }, { status: 403 });
    }

    console.log(`Admin ${userEmail} attempting to delete user ${userId}`);

    // First, remove from all workspace memberships
    const { error: membersError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('user_id', userId);

    if (membersError) {
      console.error('Error removing from workspace members:', membersError);
      return NextResponse.json({ 
        success: false, 
        message: `Fout bij verwijderen uit workspaces: ${membersError.message}` 
      }, { status: 500 });
    }

    // Then delete the user from Supabase Auth
    const { error: userError } = await supabase.auth.admin.deleteUser(userId);

    if (userError) {
      console.error('Error deleting user from auth:', userError);
      return NextResponse.json({ 
        success: false, 
        message: `Fout bij verwijderen gebruiker: ${userError.message}` 
      }, { status: 500 });
    }

    console.log(`Successfully deleted user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Gebruiker succesvol verwijderd!' 
    });

  } catch (error) {
    console.error('Unexpected error in delete-user:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Onverwachte fout: ${error}` 
    }, { status: 500 });
  }
}
