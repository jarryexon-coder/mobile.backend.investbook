import axios from 'axios';
import { EXPO_PUBLIC_APIFY_API_TOKEN } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APIFY_API_TOKEN = EXPO_PUBLIC_APIFY_API_TOKEN;

export const checkActorHealth = async () => {
    try {
        console.log('🏥 Running actor health check...');
        
        // Check token validity
        const userResponse = await axios.get(
            'https://api.apify.com/v2/users/me',
            { params: { token: APIFY_API_TOKEN } }
        );
        
        if (userResponse.data) {
            console.log('✅ Apify token is valid');
            console.log('👤 User:', userResponse.data.data.username);
            console.log('📧 Email:', userResponse.data.data.email);
            console.log('💳 Plan:', userResponse.data.data.plan?.id || 'Unknown');
            
            // Store user info in cache
            await AsyncStorage.setItem('apifyUser', JSON.stringify(userResponse.data.data));
        }
        
        // Check actor accessibility
        const actors = ['shahidirfan~bizbuysell-scraper', 'fatihtahta~bizbuysell-scraper'];
        let workingActors = [];
        
        for (const actorId of actors) {
            try {
                const actorResponse = await axios.get(
                    `https://api.apify.com/v2/acts/${actorId}`,
                    { params: { token: APIFY_API_TOKEN } }
                );
                if (actorResponse.data) {
                    console.log(`✅ Actor ${actorId} is accessible`);
                    workingActors.push(actorId);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log(`❌ Actor ${actorId} requires subscription`);
                } else {
                    console.log(`❌ Actor ${actorId} not accessible:`, error.message);
                }
            }
        }
        
        // Store working actors
        await AsyncStorage.setItem('workingActors', JSON.stringify(workingActors));
        
        return {
            tokenValid: true,
            workingActors: workingActors,
            hasSubscriptions: workingActors.length > 0,
        };
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return {
            tokenValid: false,
            workingActors: [],
            hasSubscriptions: false,
            error: error.message,
        };
    }
};

// Run health check on app start
export const initializeActorHealth = async () => {
    const health = await checkActorHealth();
    
    if (!health.hasSubscriptions) {
        console.warn('⚠️ No working actors found. Using mock data fallback.');
        console.warn('📝 To fix: Subscribe to actors in Apify console');
    }
    
    return health;
};
