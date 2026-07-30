import axios from 'axios';
import { EXPO_PUBLIC_APIFY_API_TOKEN } from '@env';

export const testApifyToken = async () => {
    try {
        console.log('🔑 Testing Apify token...');
        const response = await axios.get('https://api.apify.com/v2/user/me', {
            params: { token: EXPO_PUBLIC_APIFY_API_TOKEN }
        });
        console.log('✅ Token valid! User:', response.data.data.username);
        console.log('📊 User ID:', response.data.data.id);
        return true;
    } catch (error) {
        console.error('❌ Token invalid:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('🔍 Error details:', error.response.data.error);
        }
        return false;
    }
};

export const listUserActors = async () => {
    try {
        console.log('📋 Fetching your actors...');
        const response = await axios.get('https://api.apify.com/v2/acts', {
            params: { token: EXPO_PUBLIC_APIFY_API_TOKEN }
        });
        console.log('✅ Actors found:', response.data.data?.items?.length || 0);
        response.data.data?.items?.forEach(actor => {
            console.log(`  - ${actor.id} (${actor.name})`);
        });
        return response.data.data?.items || [];
    } catch (error) {
        console.error('❌ Failed to fetch actors:', error.message);
        return [];
    }
};
