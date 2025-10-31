import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('OK', { headers: corsHeaders });
  }

  try {
    const { name, submittedBy, subject, message } = await req.json();

    console.log('👉 Received request with data:', { name, submittedBy, subject, message });

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY is missing');
      return new Response('Missing API Key', {
        status: 500,
        headers: corsHeaders,
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@ablackmarketplace.com', // 👈 your verified sender
        to: 'ablackweb@gmail.com',             // 👈 your recipient
        subject,
        html: `
          <h2>New Business Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Submitted by:</strong> ${submittedBy}</p>
          <pre style="white-space: pre-wrap;">${message}</pre>
        `,
      }),
    });

    const data = await response.json();
    console.log('📨 Resend response:', data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('💥 Error in sendEmail function:', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
