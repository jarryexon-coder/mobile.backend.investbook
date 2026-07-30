// Generate realistic mock data for different states
export const generateMockBusinesses = (location = 'United States', count = 20) => {
    const states = [
        { city: 'Austin', state: 'TX', businesses: ['Tech Startup', 'Software Company', 'IT Consulting'] },
        { city: 'Miami', state: 'FL', businesses: ['Restaurant Chain', 'Hotel', 'Tourism Agency'] },
        { city: 'Denver', state: 'CO', businesses: ['Construction Co', 'Real Estate', 'Property Management'] },
        { city: 'Seattle', state: 'WA', businesses: ['Coffee Shop', 'Tech Company', 'Logistics'] },
        { city: 'New York', state: 'NY', businesses: ['Retail Store', 'Marketing Agency', 'Financial Services'] },
        { city: 'Chicago', state: 'IL', businesses: ['Food Distributor', 'Manufacturing', 'Transportation'] },
        { city: 'Los Angeles', state: 'CA', businesses: ['Entertainment', 'Fashion', 'Digital Media'] },
        { city: 'Dallas', state: 'TX', businesses: ['Oil & Gas', 'Real Estate', 'Healthcare'] },
        { city: 'Atlanta', state: 'GA', businesses: ['Logistics', 'Supply Chain', 'Technology'] },
        { city: 'Phoenix', state: 'AZ', businesses: ['Construction', 'Real Estate', 'Retail'] },
    ];
    
    const categories = [
        'Technology', 'Food & Beverage', 'Retail', 'Construction', 
        'Healthcare', 'Real Estate', 'Transportation', 'Manufacturing',
        'Professional Services', 'Education', 'Entertainment', 'Hospitality'
    ];
    
    const businesses = [];
    const statesToUse = location === 'United States' ? states : states.filter(s => 
        location.toLowerCase().includes(s.state.toLowerCase()) || 
        location.toLowerCase().includes(s.city.toLowerCase())
    );
    
    const selectedStates = statesToUse.length > 0 ? statesToUse : states.slice(0, 5);
    
    for (const stateData of selectedStates) {
        const numBusinesses = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < Math.min(numBusinesses, count - businesses.length); i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const price = (Math.floor(Math.random() * 90) + 10) * 10000;
            const revenue = price * (0.2 + Math.random() * 0.3);
            const cashFlow = revenue * (0.4 + Math.random() * 0.3);
            
            businesses.push({
                id: `mock-${businesses.length + 1}`,
                title: `${stateData.businesses[i % stateData.businesses.length]} for Sale`,
                price: price,
                priceDisplay: `$${price.toLocaleString()}`,
                revenue: Math.round(revenue),
                cashFlow: Math.round(cashFlow),
                location: `${stateData.city}, ${stateData.state}`,
                city: stateData.city,
                state: stateData.state,
                category: category,
                source: 'Mock Data',
                description: `Established ${category.toLowerCase()} business in ${stateData.city}, ${stateData.state}. Well-maintained with strong customer base.`,
                broker: `${stateData.city} Business Brokers`,
                imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`,
            });
        }
    }
    
    return businesses.slice(0, count);
};

export const generateMockRealEstate = (location = 'United States', count = 15) => {
    const properties = [
        { city: 'Austin', state: 'TX', type: 'Office', size: '15,000 SF', price: 2500000 },
        { city: 'Miami', state: 'FL', type: 'Retail', size: '8,000 SF', price: 3200000 },
        { city: 'Denver', state: 'CO', type: 'Industrial', size: '50,000 SF', price: 4800000 },
        { city: 'Seattle', state: 'WA', type: 'Office', size: '25,000 SF', price: 3800000 },
        { city: 'New York', state: 'NY', type: 'Mixed-Use', size: '30,000 SF', price: 8500000 },
        { city: 'Chicago', state: 'IL', type: 'Retail', size: '12,000 SF', price: 2900000 },
        { city: 'Los Angeles', state: 'CA', type: 'Industrial', size: '75,000 SF', price: 6200000 },
        { city: 'Dallas', state: 'TX', type: 'Office', size: '20,000 SF', price: 3100000 },
        { city: 'Atlanta', state: 'GA', type: 'Retail', size: '10,000 SF', price: 2400000 },
        { city: 'Phoenix', state: 'AZ', type: 'Industrial', size: '100,000 SF', price: 5500000 },
        { city: 'Boston', state: 'MA', type: 'Office', size: '18,000 SF', price: 4200000 },
        { city: 'San Francisco', state: 'CA', type: 'Mixed-Use', size: '22,000 SF', price: 9800000 },
        { city: 'Washington', state: 'DC', type: 'Office', size: '12,000 SF', price: 3600000 },
        { city: 'Nashville', state: 'TN', type: 'Retail', size: '6,000 SF', price: 2100000 },
        { city: 'Portland', state: 'OR', type: 'Industrial', size: '40,000 SF', price: 3400000 },
    ];
    
    const selected = location === 'United States' ? properties : 
        properties.filter(p => 
            location.toLowerCase().includes(p.state.toLowerCase()) || 
            location.toLowerCase().includes(p.city.toLowerCase())
        );
    
    return selected.slice(0, count).map(p => ({
        id: `prop-${Math.random()}`,
        title: `${p.type} Building in ${p.city}`,
        price: p.price,
        priceDisplay: `$${p.price.toLocaleString()}`,
        address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Market', 'Broadway', 'Oak', 'Pine'][Math.floor(Math.random() * 5)]} St`,
        city: p.city,
        state: p.state,
        propertyType: p.type,
        source: 'Mock Data',
        description: `Prime ${p.type.toLowerCase()} property in ${p.city}, ${p.state}. Excellent location with strong rental potential.`,
        size: p.size,
        imageUrl: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`,
    }));
};
