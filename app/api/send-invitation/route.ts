import { NextRequest, NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, invitationUrl, workspaceName, role, userName } = await request.json();

    // For now, we'll use a simple email service
    // You can integrate with SendGrid, Resend, or any other email service
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'RevImpact <noreply@revimpact.nl>',
      to: [email],
      subject: `Uitnodiging voor RevImpact Workspace: ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3A6FF8, #8AE34C); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">RevImpact</h1>
            <p style="color: white; margin: 5px 0 0 0; font-size: 14px;">Maximize your revenue impact</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #1E1E1E; margin-top: 0;">Hallo${userName ? ` ${userName}` : ''}!</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Je bent uitgenodigd om lid te worden van de workspace <strong>${workspaceName}</strong> 
              met de rol <strong>${role === 'owner' ? 'Eigenaar' : 'Lid'}</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background: linear-gradient(135deg, #3A6FF8, #8AE34C); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                Accepteer Uitnodiging
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Klik op de knop hierboven om je account aan te maken en toegang te krijgen tot de workspace. 
              Deze uitnodiging verloopt over 7 dagen.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Als je deze uitnodiging niet verwachtte, kun je deze e-mail negeren.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Fout bij versturen van e-mail' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Uitnodiging per e-mail verstuurd!' 
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Onverwachte fout bij versturen van e-mail' 
    }, { status: 500 });
  }
}
