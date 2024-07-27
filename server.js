const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xml2js= require("xml2js");

const app = express();

app.use(cors({origin: 'https://amedeus.vercel.app'}
));
app.use(express.json());

const baseURL = "https://ssl00.kiusys.com/ws3/index.php";

const axiosInstance = axios.create({
    baseURL: `${baseURL}`, // Base URL for all requests
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded' // Default content type
    }
})

const getAvailableFlights = async (data) => {
    const {
        from,
        to,
        cabinPref,
        passengerQuantity,
        dateString
    } = data;
    console.log(`<?xml version="1.0" encoding="UTF-8"?>
<KIU_AirAvailRQ EchoToken="1" Target="Production" Version="3.0" SequenceNmbr="1" PrimaryLangID="en-us" DirectFlightsOnly="false" MaxResponses="10" CombinedItineraries="false">
    <POS>
        <Source AgentSine="PTYS3653X" TerminalID="PTYS36504R" ISOCountry="PA" />
    </POS>
    <OriginDestinationInformation>
        <DepartureDateTime>${dateString}</DepartureDateTime>
        <OriginLocation LocationCode="${from}" />
        <DestinationLocation LocationCode="${to}" />
    </OriginDestinationInformation>
        <TravelPreferences MaxStopsQuantity="4">
        
    </TravelPreferences>
    <TravelerInfoSummary>
        <AirTravelerAvail>
            <PassengerTypeQuantity Code="ADT" Quantity="${passengerQuantity}" />
        </AirTravelerAvail>
    </TravelerInfoSummary>
</KIU_AirAvailRQ>`);


    const response = await axiosInstance.post('', {
        user: "MYDESTINYPANAMA",
        password: "!%XQJ7MB3969J*Qn",
        request: `<?xml version="1.0" encoding="UTF-8"?>
<KIU_AirAvailRQ EchoToken="1" Target="Production" Version="3.0" SequenceNmbr="1" PrimaryLangID="en-us" DirectFlightsOnly="false" MaxResponses="10" CombinedItineraries="false">
    <POS>
        <Source AgentSine="PTYS3653X" TerminalID="PTYS36504R" ISOCountry="PA" />
    </POS>
    <OriginDestinationInformation>
        <DepartureDateTime>${dateString}</DepartureDateTime>
        <OriginLocation LocationCode="${from}" />
        <DestinationLocation LocationCode="${to}" />
    </OriginDestinationInformation>
        <TravelPreferences MaxStopsQuantity="4">
        
    </TravelPreferences>
    <TravelerInfoSummary>
        <AirTravelerAvail>
            <PassengerTypeQuantity Code="ADT" Quantity="${passengerQuantity}" />
        </AirTravelerAvail>
    </TravelerInfoSummary>
</KIU_AirAvailRQ>`
    })
    const parser = new xml2js.Parser();
    const parsedResponse = await parser.parseStringPromise(response.data);
    return parsedResponse;
}

const getData = (segments) => {
    const flights = segments?.map((segment, index) => {
        const flightSegment = segment.FlightSegment;
        const stopsDetails = flightSegment.map((data, index) => {
            const bookingClassAvailable = data.BookingClassAvail.map((bookingClass, index) => {
                return {
                    resBookDesignCode: bookingClass.$.ResBookDesigCode,
                    resBookDesignQuantity: bookingClass.$.ResBookDesigQuantity
                }
            })
            return {
                from: data.DepartureAirport[0].$.LocationCode,
                to: data.ArrivalAirport[0].$.LocationCode,
                ailinecode: data.MarketingAirline[0].$.CompanyShortName,
                flightNumber: data.$.FlightNumber,
                departureDateTime: data.$.DepartureDateTime,
                arrivalDateTime: data.$.ArrivalDateTime,
                journeyDuration: data.$.JourneyDuration,
                bookingClassAvailable,
            }
        })
        console.log(stopsDetails);
        return {stopsDetails}
    })
    return flights;
}

app.get("/",(req,res) => {
    res.json({ message: "Server is up and running!" });
})


app.post('/flights/query', async (req,res) => {
    try {
        const { from, to, cabinPref, passengerQuantity, departureDate } = req.body;
        console.log(from, to, cabinPref, passengerQuantity, departureDate);
        console.log(departureDate);
        const newDate = new Date(departureDate);
        console.log(newDate);
        const dateString = newDate.toISOString().slice(0, 10);
        const response = await getAvailableFlights({ from, to, cabinPref, passengerQuantity, dateString })
        const segments = response.KIU_AirAvailRS?.OriginDestinationInformation[0]?.OriginDestinationOptions[0]?.OriginDestinationOption;
        const flights = getData(segments);
        // const price = await getFlightPrice(flights);
        return res.json(flights)
    } catch (error) {
        res.json({ error: error.message })
    }
})

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`> App running on port ${PORT} ...`);
});