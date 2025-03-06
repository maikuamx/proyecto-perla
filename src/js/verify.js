// Initialize Supabase client
const supabaseUrl = 'https://rxjquziaipslqtmgqeoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4anF1emlhaXBzbHF0bWdxZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQzMTEsImV4cCI6MjA1NjAwMDMxMX0.iu4ovJ2QumGBROQOnbljQ9kPSirYvfgYiEukxJrHD3Q';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function verifyEmail() {
    try {
        // Get the token from the URL
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        const type = params.get('type');
        
        if (!token || type !== 'email_verification') {
            throw new Error('Token de verificación inválido');
        }

        // Set the session with the token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) throw error;

        // Update user profile to mark email as verified
        const { error: updateError } = await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // Show success state
        document.getElementById('verifyLoading').style.display = 'none';
        document.getElementById('verifySuccess').style.display = 'flex';

    } catch (error) {
        console.error('Error during verification:', error);
        
        // Show error state
        document.getElementById('verifyLoading').style.display = 'none';
        document.getElementById('verifyError').style.display = 'flex';
    }
}

// Start verification when page loads
document.addEventListener('DOMContentLoaded', verifyEmail);