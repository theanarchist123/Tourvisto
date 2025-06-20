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

interface Country {
    name: string;
    coordinates: number[];
    value: string;
    openStreetMap?: string;
}

interface TripFormData {
    country: string;
    travelStyle: string;
    interest: string;
    budget: string;
    duration: number;
    groupType: string;
}

export const loader = async () => {
    // List of APIs to try in order
    const apis = [
        {
            url: 'https://api.first.org/data/v1',
            transform: (data: any) => {
                // This API returns { data: { countryCode: { country: "Name" } } }
                const countries = Object.entries(data.data).map(([code, info]: [string, any]) => ({
                    name: getFlagEmoji(code) + ' ' + info.country,
                    coordinates: [0, 0],
                    value: info.country
                }));
                return countries;
            }
        },
        {
            url: 'https://restful-countries.com/v3/all',
            transform: (data: any) => {
                return data.map((country: any) => ({
                    name: (country.flag || getFlagEmoji(country.cca2) || '') + ' ' + country.name.common,
                    coordinates: country.latlng || [0, 0],
                    value: country.name.common
                }));
            }
        }
    ];

    for (const api of apis) {
        try {
            console.log(`Trying to fetch countries from ${api.url}...`);
            const response = await fetch(api.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`API Error for ${api.url}:`, response.status, response.statusText);
                continue; // Try next API
            }

            const data = await response.json();
            const formattedData = api.transform(data);
            
            if (formattedData && formattedData.length > 0) {
                console.log('Successfully loaded', formattedData.length, 'countries');
                console.log('Sample country:', formattedData[0]);
                return formattedData;
            }
        } catch (error) {
            console.error(`Error with ${api.url}:`, error);
            continue; // Try next API
        }
    }

    // If all APIs fail, return a minimal fallback list of major countries
    console.log('All APIs failed, using fallback data');
    return [
        { name: getFlagEmoji('US') + ' United States', coordinates: [38, -97], value: 'United States' },
        { name: getFlagEmoji('GB') + ' United Kingdom', coordinates: [54, -2], value: 'United Kingdom' },
        { name: getFlagEmoji('FR') + ' France', coordinates: [46, 2], value: 'France' },
        { name: getFlagEmoji('DE') + ' Germany', coordinates: [51, 9], value: 'Germany' },
        { name: getFlagEmoji('JP') + ' Japan', coordinates: [36, 138], value: 'Japan' },
        { name: getFlagEmoji('IN') + ' India', coordinates: [20, 77], value: 'India' },
        { name: getFlagEmoji('CN') + ' China', coordinates: [35, 105], value: 'China' },
    ];
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string) {
    if (!countryCode || countryCode.length !== 2) return '';
    return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
}

const CreateTrip = ({ loaderData }: Route.ComponentProps ) => {
    const countries = loaderData as Country[];
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TripFormData>({
        country: countries[0]?.name || '',
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
           })

           const result: CreateTripResponse = await response.json();

           if(result?.id) navigate(`/trips/${result.id}`)
           else console.error('Failed to generate a trip')
       } catch (e) {
           console.error('Error generating trip', e);
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
    }))

    const mapData = [
        {
            country: formData.country,
            color: '#EA382E',
            coordinates: countries.find((c: Country) => c.name === formData.country)?.coordinates || []
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
                        </label>                        <ComboBoxComponent
                            id="country"
                            dataSource={countryData}
                            fields={{ text: 'text', value: 'value' }}
                            placeholder="Select a Country"
                            className="combo-box"
                            change={(e: { value: string | undefined }) => {
                                if(e.value) {
                                    handleChange('country', e.value)
                                }
                            }}
                            allowFiltering
                            filtering={(e) => {
                                const query = e.text.toLowerCase();
                                e.updateData(
                                    countryData.filter((country) => 
                                        country.text.toLowerCase().includes(query)
                                    )
                                );
                            }}
                        />
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