const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client for Codexel Telemetry
 * Handles communication with the Supabase Edge Function /ingest endpoint
 */
class SupabaseClient {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    /**
     * Initialize the Supabase client with environment variables
     * @returns {boolean} True if initialization successful
     */
    initialize() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
                console.warn('[SupabaseClient] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
                return false;
            }

            this.client = createClient(supabaseUrl, supabaseAnonKey);
            this.initialized = true;
            console.log('[SupabaseClient] Successfully initialized');
            return true;
        } catch (error) {
            console.error('[SupabaseClient] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Send telemetry events to the Supabase Edge Function /ingest endpoint
     * @param {Array} events - Array of telemetry events (AppFocusEvent | PromptSubmitEvent)
     * @param {string} sessionId - Session ID for the current assessment
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendTelemetryEvents(events, sessionId) {
        if (!this.initialized || !this.client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            // Format events according to CLAUDE.md schema
            const formattedEvents = events.map(event => ({
                ...event,
                sessionId,
                ts: Date.now()
            }));

            console.log(`[SupabaseClient] Sending ${formattedEvents.length} events for session ${sessionId}`);

            // Call the Edge Function
            const { data, error } = await this.client.functions.invoke('ingest', {
                body: {
                    events: formattedEvents,
                    sessionId
                }
            });

            if (error) {
                console.error('[SupabaseClient] Edge function error:', error);
                return { success: false, error: error.message };
            }

            console.log('[SupabaseClient] Events sent successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('[SupabaseClient] Failed to send telemetry events:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create a new session record
     * @param {string} candidateId - Candidate identifier
     * @returns {Promise<{success: boolean, sessionId?: string, error?: string}>}
     */
    async createSession(candidateId) {
        if (!this.initialized || !this.client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const { data, error } = await this.client
                .from('sessions')
                .insert([
                    {
                        candidate_id: candidateId,
                        started_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('[SupabaseClient] Failed to create session:', error);
                return { success: false, error: error.message };
            }

            console.log('[SupabaseClient] Session created:', data.id);
            return { success: true, sessionId: data.id };
        } catch (error) {
            console.error('[SupabaseClient] Session creation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * End a session by updating the ended_at timestamp
     * @param {string} sessionId - Session ID to end
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async endSession(sessionId) {
        if (!this.initialized || !this.client) {
            return { success: false, error: 'Supabase client not initialized' };
        }

        try {
            const { error } = await this.client
                .from('sessions')
                .update({ ended_at: new Date().toISOString() })
                .eq('id', sessionId);

            if (error) {
                console.error('[SupabaseClient] Failed to end session:', error);
                return { success: false, error: error.message };
            }

            console.log('[SupabaseClient] Session ended:', sessionId);
            return { success: true };
        } catch (error) {
            console.error('[SupabaseClient] Session end error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Test connection to Supabase
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        if (!this.initialized || !this.client) {
            return false;
        }

        try {
            const { data, error } = await this.client
                .from('sessions')
                .select('id')
                .limit(1);

            if (error) {
                console.error('[SupabaseClient] Connection test failed:', error);
                return false;
            }

            console.log('[SupabaseClient] Connection test successful');
            return true;
        } catch (error) {
            console.error('[SupabaseClient] Connection test error:', error);
            return false;
        }
    }
}

// Export singleton instance
const supabaseClient = new SupabaseClient();
module.exports = supabaseClient;