import express from "express"
import validator from "validator"
import redis from "../db/redis.js";
import pool from "../db/postgres.js";

const router = express.Router();
const BASE_URL = "http://localhost:5001";

function encodeBase62(num) {
    const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    while (num > 0) {
        result = BASE62[num % 62] + result;
        num = Math.floor(num / 62);
    }
    return result;
}

router.get("/", (req, res) => {
    res.json({ message: "URL Shortener API is active" });
});

// POST /api/shorten
router.post("/api/shorten", async(req,res) => {
    try{
        let {url} = req.body;

        //validate
        if(!url || !validator.isURL(url, {
            protocols: ["http", "https"],
            require_protocol: true
        })){
            return res.status(400).json({error: "Url is required"});
        }
        url = url.trim().replace(/\/+$/, "");

        //check Redis cache
        const cached = await redis.get(`longurl:${url}`);
        if(cached){
            console.log("Cache hit for URL:", url);
            return res.status(200).json({
                shortURL: `${BASE_URL}/${cached}`
            });
        }

        //check Postgres db
        const result = await pool.query(
            `
            SELECT short_code
            FROM urls
            WHERE long_url = $1
            `,
            [url]
        );
        if(result.rows.length > 0){
            const shortCode = result.rows[0].short_code;

            return res.status(200).json({
                shortURL: `${BASE_URL}/${shortCode}`
            });
        }

        // insert and generate shortcode
        const idResult = await pool.query("SELECT nextval('urls_id_seq')");
        const newId = parseInt(idResult.rows[0].nextval);
        const shortCode = encodeBase62(newId);

        await pool.query(
            "INSERT INTO urls (id, long_url, short_code) VALUES ($1, $2, $3)",
            [newId, url, shortCode]
        );

        await redis.set(`longurl:${url}`, shortCode);
        await redis.set(`short:${shortCode}`, url);
        return res.status(201).json({
            shortURL: `${BASE_URL}/${shortCode}`
        });
    }
    catch(error){
        console.error("DEBUG ERROR:", error);
        res.status(500).json({error: "Server error"});
    }
})

// GET /:shortcode
router.get("/:shortCode", async(req,res) => {
    try{
        const {shortCode} = req.params;
        if(!shortCode){
            return res.status(400).json({error: "Short code is required"});
        }
        const cached = await redis.get(`short:${shortCode}`);
        if(cached){
            return res.redirect(cached);
        }
        const result = await pool.query(
            `
            SELECT long_url
            FROM urls
            WHERE short_code = $1
            `,
            [shortCode]
        );
        if(result.rows.length === 0){
            return res.status(404).json({error: "Short code not found"});
        }
        const longUrl = result.rows[0].long_url;
        await redis.set(`short:${shortCode}`, longUrl);
        await redis.set(`longurl:${longUrl}`, shortCode);
        return res.redirect(301, longUrl);
    }
    catch(error){
        console.error("DEBUG ERROR:", error);
        res.status(500).json({error: "Server error"});
    }
})

// PUT /api/

export default router;