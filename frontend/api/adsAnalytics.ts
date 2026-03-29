import axios from "axios";
export const getAdsAnalytics = async () => {
    try {
        const res = await axios.get(`${process.env.LOCAL_URL}/ads-analytics`);
        return res.data;
    } catch (error) {
        console.log(error);
    }
}
