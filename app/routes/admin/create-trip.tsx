import {Header} from "../../../components";
import {ComboBoxComponent} from "@syncfusion/ej2-react-dropdowns";
import type { Route } from './+types/create-trip'
import {comboBoxItems, selectItems} from "~/constants";
import {cn, formatKey} from "~/lib/utils";
import {LayerDirective, LayersDirective, MapsComponent} from "@syncfusion/ej2-react-maps";
import React, {useState} from "react";
import {world_map} from "~/constants/world_map";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import {account} from "~/appwrite/client";
import {useNavigate} from "react-router";

export const loader = async () => {
    // Helper function to get emoji flag from country code
    const getFlagEmoji = (countryCode: string): string => {
        if (!countryCode || countryCode.length !== 2) return '🏳️';
        
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    // Comprehensive country data with proper flag mappings
    const countryFlagMap: { [key: string]: string } = {
        'United States': '🇺🇸',
        'Japan': '🇯🇵',
        'France': '🇫🇷',
        'Italy': '🇮🇹',
        'Spain': '🇪🇸',
        'United Kingdom': '🇬🇧',
        'Germany': '🇩🇪',
        'Australia': '🇦🇺',
        'Canada': '🇨🇦',
        'Brazil': '🇧🇷',
        'India': '🇮🇳',
        'China': '🇨🇳',
        'Russia': '🇷🇺',
        'South Africa': '🇿🇦',
        'Mexico': '🇲🇽',
        'Thailand': '🇹🇭',
        'Singapore': '🇸🇬',
        'United Arab Emirates': '🇦🇪',
        'Saudi Arabia': '🇸🇦',
        'South Korea': '🇰🇷',
        'Netherlands': '🇳🇱',
        'Switzerland': '🇨🇭',
        'Belgium': '🇧🇪',
        'Austria': '🇦🇹',
        'Portugal': '🇵🇹',
        'Greece': '🇬🇷',
        'Turkey': '🇹🇷',
        'Egypt': '🇪🇬',
        'Israel': '🇮🇱',
        'Malaysia': '🇲🇾'
    };

    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        return data.map((country: any) => {
            const countryName = country.name.common;
            const flagEmoji = countryFlagMap[countryName] || getFlagEmoji(country.cca2) || '🏳️';
            
            return {
                name: `${flagEmoji} ${countryName}`,
                coordinates: country.latlng || [0, 0],
                value: countryName,
                openStreetMap: country.maps?.openStreetMaps,
            };
        });
    } catch (error) {
        console.error('Failed to fetch countries from API, using fallback data:', error);
        
        // Fallback country data with guaranteed working flags
        return [
            { name: '🇺🇸 United States', coordinates: [37.0902, -95.7129], value: 'United States', openStreetMap: 'https://www.openstreetmap.org/relation/148838' },
            { name: '🇯🇵 Japan', coordinates: [36.2048, 138.2529], value: 'Japan', openStreetMap: 'https://www.openstreetmap.org/relation/382313' },
            { name: '🇫🇷 France', coordinates: [46.2276, 2.2137], value: 'France', openStreetMap: 'https://www.openstreetmap.org/relation/1403916' },
            { name: '🇮🇹 Italy', coordinates: [41.8719, 12.5674], value: 'Italy', openStreetMap: 'https://www.openstreetmap.org/relation/365331' },
            { name: '🇪🇸 Spain', coordinates: [40.4637, -3.7492], value: 'Spain', openStreetMap: 'https://www.openstreetmap.org/relation/1311341' },
            { name: '🇬🇧 United Kingdom', coordinates: [55.3781, -3.4360], value: 'United Kingdom', openStreetMap: 'https://www.openstreetmap.org/relation/62149' },
            { name: '🇩🇪 Germany', coordinates: [51.1657, 10.4515], value: 'Germany', openStreetMap: 'https://www.openstreetmap.org/relation/51477' },
            { name: '🇦🇺 Australia', coordinates: [-25.2744, 133.7751], value: 'Australia', openStreetMap: 'https://www.openstreetmap.org/relation/80500' },
            { name: '🇨🇦 Canada', coordinates: [56.1304, -106.3468], value: 'Canada', openStreetMap: 'https://www.openstreetmap.org/relation/1428125' },
            { name: '🇧🇷 Brazil', coordinates: [-14.2350, -51.9253], value: 'Brazil', openStreetMap: 'https://www.openstreetmap.org/relation/59470' },
            { name: '🇮🇳 India', coordinates: [20.5937, 78.9629], value: 'India', openStreetMap: 'https://www.openstreetmap.org/relation/304716' },
            { name: '🇨🇳 China', coordinates: [35.8617, 104.1954], value: 'China', openStreetMap: 'https://www.openstreetmap.org/relation/270056' },
            { name: '🇷🇺 Russia', coordinates: [61.5240, 105.3188], value: 'Russia', openStreetMap: 'https://www.openstreetmap.org/relation/60189' },
            { name: '🇿🇦 South Africa', coordinates: [-30.5595, 22.9375], value: 'South Africa', openStreetMap: 'https://www.openstreetmap.org/relation/87565' },
            { name: '🇲🇽 Mexico', coordinates: [23.6345, -102.5528], value: 'Mexico', openStreetMap: 'https://www.openstreetmap.org/relation/114686' },
            { name: '🇹🇭 Thailand', coordinates: [15.8700, 100.9925], value: 'Thailand', openStreetMap: 'https://www.openstreetmap.org/relation/2067731' },
            { name: '🇸🇬 Singapore', coordinates: [1.3521, 103.8198], value: 'Singapore', openStreetMap: 'https://www.openstreetmap.org/relation/536780' },
            { name: '🇦🇪 United Arab Emirates', coordinates: [23.4241, 53.8478], value: 'United Arab Emirates', openStreetMap: 'https://www.openstreetmap.org/relation/307763' },
            { name: '🇸🇦 Saudi Arabia', coordinates: [23.8859, 45.0792], value: 'Saudi Arabia', openStreetMap: 'https://www.openstreetmap.org/relation/307584' },
            { name: '🇰🇷 South Korea', coordinates: [35.9078, 127.7669], value: 'South Korea', openStreetMap: 'https://www.openstreetmap.org/relation/307756' },
            { name: '🇳🇱 Netherlands', coordinates: [52.1326, 5.2913], value: 'Netherlands', openStreetMap: 'https://www.openstreetmap.org/relation/47796' },
            { name: '🇨🇭 Switzerland', coordinates: [46.8182, 8.2275], value: 'Switzerland', openStreetMap: 'https://www.openstreetmap.org/relation/51701' },
            { name: '🇧🇪 Belgium', coordinates: [50.5039, 4.4699], value: 'Belgium', openStreetMap: 'https://www.openstreetmap.org/relation/52411' },
            { name: '🇦🇹 Austria', coordinates: [47.5162, 14.5501], value: 'Austria', openStreetMap: 'https://www.openstreetmap.org/relation/16239' },
            { name: '🇵🇹 Portugal', coordinates: [39.3999, -8.2245], value: 'Portugal', openStreetMap: 'https://www.openstreetmap.org/relation/295480' },
            { name: '🇬🇷 Greece', coordinates: [39.0742, 21.8243], value: 'Greece', openStreetMap: 'https://www.openstreetmap.org/relation/192307' },
            { name: '🇹🇷 Turkey', coordinates: [38.9637, 35.2433], value: 'Turkey', openStreetMap: 'https://www.openstreetmap.org/relation/174737' },
            { name: '🇪🇬 Egypt', coordinates: [26.0975, 30.0444], value: 'Egypt', openStreetMap: 'https://www.openstreetmap.org/relation/1473947' },
            { name: '🇮🇱 Israel', coordinates: [31.0461, 34.8516], value: 'Israel', openStreetMap: 'https://www.openstreetmap.org/relation/1473946' },
            { name: '🇲🇾 Malaysia', coordinates: [4.2105, 101.9758], value: 'Malaysia', openStreetMap: 'https://www.openstreetmap.org/relation/2108121' }
        ];
    }
}

const CreateTrip = ({ loaderData }: Route.ComponentProps ) => {
    const countries = loaderData as Country[];
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TripFormData>({
        country: countries?.[0]?.value || 'United States',
        travelStyle: '',
        interest: '',
        budget: '',
        duration: 0,
        groupType: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault()
        setLoading(true);

       if(
           !formData.country ||
           !formData.travelStyle ||
           !formData.interest ||
           !formData.budget ||
           !formData.groupType
       ) {
           setError('Please provide values for all fields');
           setLoading(false)
           return;
       }

       if(formData.duration < 1 || formData.duration > 10) {
           setError('Duration must be between 1 and 10 days');
           setLoading(false)
           return;
       }
       const user = await account.get();
       if(!user.$id) {
           console.error('User not authenticated');
           setLoading(false)
           return;
       }

       try {
           const response = await fetch('/api/create-trip', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json'},
               body: JSON.stringify({
                   country: formData.country,
                   numberOfDays: formData.duration,
                   travelStyle: formData.travelStyle,
                   interests: formData.interest,
                   budget: formData.budget,
                   groupType: formData.groupType,
                   userId: user.$id
               })
           });

           let result: any = null;
           const contentType = response.headers.get("content-type");
           if (contentType && contentType.includes("application/json")) {
               result = await response.json();
           } else {
               const textError = await response.text();
               console.error("Server returned non-JSON error response:", textError);
               setError("Server error: " + (textError.slice(0, 100) || "Failed to generate trip"));
               return;
           }

           if (!response.ok || result?.error) {
               setError(result?.error || 'Failed to generate trip');
               return;
           }

           if(result?.id) navigate(`/trips/${result.id}`)
           else setError('Failed to generate a trip')
       } catch (e: any) {
           console.error('Error generating trip', e);
           setError(e?.message || 'Error generating trip');
       } finally {
           setLoading(false)
       }
    };

    const handleChange = (key: keyof TripFormData, value: string | number)  => {
    setFormData({ ...formData, [key]: value})
    }
    const countryData = countries.map((country) => ({
        text: country.name,
        value: country.value,
    }));

    const mapData = [
        {
            country: formData.country,
            color: '#EA382E',
            coordinates: countries?.find((c: Country) => c.value === formData.country)?.coordinates || [0, 0]
        }
    ]

    return (
        <main className="flex flex-col gap-10 pb-20 wrapper">
            <Header title="Add a New Trip" description="View and edit AI Generated travel plans" />

            <section className="mt-2.5 wrapper-md">
                <form className="trip-form" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="country">
                            Country
                        </label>
                        <select
                            id="country"
                            className="form-input"
                            value={formData.country}
                            onChange={(e) => handleChange('country', e.target.value)}
                            style={{ 
                                fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
                                fontSize: '16px',
                                lineHeight: '1.5'
                            }}
                        >
                            {countryData.map((country) => (
                                <option key={country.value} value={country.value}>
                                    {country.text}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="duration">Duration</label>
                        <input
                            id="duration"
                            name="duration"
                            type="number"
                            placeholder="Enter a number of days"
                            className="form-input placeholder:text-gray-100"
                            onChange={(e) => handleChange('duration', Number(e.target.value))}
                        />
                    </div>

                    {selectItems.map((key) => (
                        <div key={key}>
                            <label htmlFor={key}>{formatKey(key)}</label>

                            <ComboBoxComponent
                                id={key}
                                dataSource={comboBoxItems[key].map((item) => ({
                                    text: item,
                                    value: item,
                                }))}
                                fields={{ text: 'text', value: 'value'}}
                                placeholder={`Select ${formatKey(key)}`}
                                change={(e: { value: string | undefined }) => {
                                    if(e.value) {
                                        handleChange(key, e.value)
                                    }
                                }}
                                allowFiltering
                                filtering={(e) => {
                                    const query = e.text.toLowerCase();

                                    e.updateData(
                                        comboBoxItems[key]
                                            .filter((item) => item.toLowerCase().includes(query))
                                            .map(((item) => ({
                                                text: item,
                                                value: item,
                                            }))))}}
                                className="combo-box"
                            />
                        </div>
                    ))}

                    <div>
                        <label htmlFor="location">
                            Location on the world map
                        </label>
                        <MapsComponent>
                            <LayersDirective>
                                <LayerDirective
                                    shapeData={world_map}
                                    dataSource={mapData}
                                    shapePropertyPath="name"
                                    shapeDataPath="country"
                                    shapeSettings={{ colorValuePath: "color", fill: "#E5E5E5" }}
                                />
                            </LayersDirective>
                        </MapsComponent>
                    </div>

                    <div className="bg-gray-200 h-px w-full" />

                    {error && (
                        <div className="error">
                            <p>{error}</p>
                        </div>
                    )}
                    <footer className="px-6 w-full">
                        <ButtonComponent type="submit"
                            className="button-class !h-12 !w-full" disabled={loading}
                        >
                            <img src={`/assets/icons/${loading ? 'loader.svg' : 'magic-star.svg'}`} className={cn("size-5", {'animate-spin': loading})} />
                            <span className="p-16-semibold text-white">
                                {loading ? 'Generating...' : 'Generate Trip'}
                            </span>
                        </ButtonComponent>
                    </footer>
                </form>
            </section>
        </main>
    )
}
export default CreateTrip