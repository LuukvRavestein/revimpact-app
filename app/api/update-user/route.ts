import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userId, memberId, name, email, role } = await request.json();
    
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
    const isAdminUser = userEmail.includes('admin') || 
                       userEmail === 'luuk@revimpact.nl' || 
                       userEmail === 'admin@revimpact.nl';

    if (!isAdminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not authorized' 
      }, { status: 403 });
    }

    // Update user metadata (name)
    if (name) {
      const { error: userError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name }
      });

      if (userError) {
        console.error('Error updating user metadata:', userError);
        return NextResponse.json({ 
          success: false, 
          message: 'Fout bij bijwerken van gebruikersnaam' 
        }, { status: 500 });
      }
    }

    // Update user email
    if (email) {
      const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
        email: email
      });

      if (emailError) {
        console.error('Error updating user email:', emailError);
        return NextResponse.json({ 
          success: false, 
          message: 'Fout bij bijwerken van email adres' 
        }, { status: 500 });
      }
    }

    // Update workspace role
    const { error: roleError } = await supabase
      .from('workspace_members')
      .update({ role: role })
      .eq('id', memberId);

    if (roleError) {
      console.error('Error updating role:', roleError);
      return NextResponse.json({ 
        success: false, 
        message: 'Fout bij bijwerken van rol' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Gebruiker succesvol bijgewerkt' 
    });

  } catch (error) {
    console.error('Error in update-user API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
