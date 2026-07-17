import axios from 'axios';

const RAPIDAPI_KEY = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';
const RAPIDAPI_HOST = 'loopnet-api3.p.rapidapi.com';
const BASE_URL = 'https://loopnet-api3.p.rapidapi.com';

const rapidApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
    },
    timeout: 30000,
});

export const searchByLocation = async (params = {}) => {
    try {
        const {
            location = 'Washington, DC',
            page = 1,
            resultCount = 25,
            searchType = 'For_Sale',
            sortOrder = 'Recommended',
            propertyType = 'Office',
            minPrice,
            maxPrice,
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('location', location);
        queryParams.append('page', page.toString());
        queryParams.append('resultCount', Math.min(resultCount, 50).toString());
        queryParams.append('searchType', searchType);
        queryParams.append('sortOrder', sortOrder);
        if (propertyType) queryParams.append('propertyType', propertyType);
        if (minPrice) queryParams.append('minPrice', minPrice.toString());
        if (maxPrice) queryParams.append('maxPrice', maxPrice.toString());

        const response = await rapidApiClient.get(`/search/bylocation?${queryParams.toString()}`);
        
        if (response.data && response.data.message && response.data.message.includes('Success')) {
            return response.data;
        }
        throw new Error(response.data?.message || 'Search failed');
    } catch (error) {
        console.error('RapidAPI search error:', error.message);
        throw error;
    }
};

export const getPropertyDetails = async (propertyId) => {
    try {
        const response = await rapidApiClient.get(`/details/byid`, {
            params: { id: propertyId }
        });
        return response.data;
    } catch (error) {
        console.error('RapidAPI property details error:', error.message);
        throw error;
    }
};
