import axios from "axios";

export const getAccount = async () => {
    try {
        const res = await axios.get(`${process.env.LOCAL_URL}/account`);
        return res.data;
    } catch (error) {
        console.log(error);
    }
}

