import express from "express"
import validator from "validator"
import redis from "../db/redis";
import pool from "../db/postgres";

const router = express.Router();

function encodeBase62(num) {
    const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    let result = "";

    while (num > 0) {
        result = BASE62[num % 62] + result;
        num = Math.floor(num / 62);
    }

    return result;
}

// POST /api/shorten
router.post("/", async(req,res) => {
    try{
        let {url} = req.body;

        //validate
        if(!url || !validator.isURL(url, {
            protocols: ["http", "https"],
            require_protocol: true
        })){
            return res.status(400).json({error: "Url is required"});
        }
        url = validator.normalizeURL(url)

        //check Redis cache
        const cached = await redis.get(`longurl:${url}`);
        if(cached){
            return res.status(200).json({
                shortURL: `http://localhost:5000/${cached}`
            });
        }

        //check Postgres db
        const result = await pool.query(
            `
            SELECT short_code
            FROM urls
            WHERE long_url = $1
            AND (expires_at IS NULL OR expires_at > NOW())
            `,
            [url]
        );
        if(result.rows.length > 0){
            const shortCode = result.rows[0].short_code;

            return res.status(200).json({
                shortURL: `http://localhost:5000/${shortCode}`
            });
        }
        await redis.set(`longurl:${url}`, shortCode);
        await redis.set(`short:${shortCode}`, url);

        // insert and generate shortcode
        const insertResult = await pool.query(
            `
            INSERT INTO urls (long_url)
            VALUES ($1)
            RETURNING id
            `,
            [url]
        );
        const id = insertResult.rows[0].id;
        const shortCode = encodeBase62(id);
        await pool.query(
            `
            UPDATE urls
            SET short_code = $1
            WHERE id = $2
            `,
            [shortCode, id]
        );
        await redis.set(`longurl:${url}`, shortCode);
        await redis.set(`short:${shortCode}`, url);
        return res.status(201).json({
            shortURL: `http://localhost:5000/${shortCode}`
        });
    }
    catch(error){
        res.status(500).json({error: "Server error"});
    }
})

// GET /:shortcode
router.get("/:shortCode", async(req,res) => {
    
})

// PUT /api/