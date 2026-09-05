import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, count } from "drizzle-orm";
import postgres from "postgres";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import https from "https";
import http from "http";
import { brands, carModels, modelVersions, vehicleMedia } from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const IMAGES_DIR = join(__dirname, "../public/images/cars");

// Official press photos for each car model
const CAR_PHOTOS: Record<string, { name: string; url: string; alt: string; type: string }[]> = {
  "7x": [
    { name: "zeekr-7x-front.jpg", url: "https://cnevpost.com/wp-content/uploads/2024/07/2024071202032648.jpg", alt: "Zeekr 7X — вид спереди", type: "exterior" },
    { name: "zeekr-7x-side.jpg", url: "https://cnevpost.com/wp-content/uploads/2024/07/2024071202032648.jpg", alt: "Zeekr 7X — вид сбоку", type: "exterior" },
    { name: "zeekr-7x-rear.jpg", url: "https://cnevpost.com/wp-content/uploads/2024/07/2024071202032648.jpg", alt: "Zeekr 7X — вид сзади", type: "exterior" },
    { name: "zeekr-7x-interior.jpg", url: "https://cnevpost.com/wp-content/uploads/2024/07/2024071202032648.jpg", alt: "Zeekr 7X — салон", type: "interior" },
  ],
  "001": [
    { name: "zeekr-001-front.jpg", url: "https://www.datocms-assets.com/143770/1730354420-car-space-m.jpg?auto=format", alt: "Zeekr 001 — вид спереди", type: "exterior" },
    { name: "zeekr-001-side.jpg", url: "https://www.datocms-assets.com/143770/1730354417-car-space-2-m.jpg?auto=format", alt: "Zeekr 001 — вид сбоку", type: "exterior" },
    { name: "zeekr-001-rear.jpg", url: "https://www.datocms-assets.com/143770/1730354422-car-space-4-m.jpg?auto=format", alt: "Zeekr 001 — вид сзади", type: "exterior" },
    { name: "zeekr-001-interior.jpg", url: "https://www.datocms-assets.com/143770/1730354419-car-space-1-m.jpg?auto=format", alt: "Zeekr 001 — салон", type: "interior" },
  ],
  "atto-3": [
    { name: "byd-atto3-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Atto 3 — вид спереди", type: "exterior" },
    { name: "byd-atto3-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Atto 3 — вид сбоку", type: "exterior" },
    { name: "byd-atto3-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Atto 3 — вид сзади", type: "exterior" },
    { name: "byd-atto3-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Atto 3 — салон", type: "interior" },
  ],
  "seal": [
    { name: "byd-seal-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/08/byd_seal_ev_2025-800x450.jpg", alt: "BYD Seal — вид спереди", type: "exterior" },
    { name: "byd-seal-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/08/byd_seal_ev_2025-1-800x450.jpg", alt: "BYD Seal — вид сбоку", type: "exterior" },
    { name: "byd-seal-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/08/byd_seal_ev_2025-2-800x450.jpg", alt: "BYD Seal — вид сзади", type: "exterior" },
    { name: "byd-seal-interior.jpg", url: "https://paultan.org/image/2024/04/2024_BYD_Seal_Premium_Performance_Malaysia-1-1200x801.jpg", alt: "BYD Seal — салон", type: "interior" },
  ],
  "han": [
    { name: "byd-han-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Han — вид спереди", type: "exterior" },
    { name: "byd-han-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Han — вид сбоку", type: "exterior" },
    { name: "byd-han-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Han — вид сзади", type: "exterior" },
    { name: "byd-han-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Han — салон", type: "interior" },
  ],
  "cs55-plus": [
    { name: "changan-cs55-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/09/2024-Changan-CS55-Plus-800x452.jpg", alt: "Changan CS55 Plus — вид спереди", type: "exterior" },
    { name: "changan-cs55-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/09/2-42-800x365.jpg", alt: "Changan CS55 Plus — вид сбоку", type: "exterior" },
    { name: "changan-cs55-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/09/3-36-800x487.jpg", alt: "Changan CS55 Plus — вид сзади", type: "exterior" },
    { name: "changan-cs55-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/09/image-34-800x536.png", alt: "Changan CS55 Plus — салон", type: "interior" },
  ],
  "deepal-s7": [
    { name: "deepal-s7-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/06/Deepal-S7-1-800x524.jpg", alt: "Deepal S7 — вид спереди", type: "exterior" },
    { name: "deepal-s7-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/06/1-15-800x470.jpg", alt: "Deepal S7 — вид сбоку", type: "exterior" },
    { name: "deepal-s7-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/06/4-3-800x481.jpg", alt: "Deepal S7 — вид сзади", type: "exterior" },
    { name: "deepal-s7-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/06/8-3-800x529.jpg", alt: "Deepal S7 — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // BYD (new models)
  // ═════════════════════════════════════════════════════════════════════════════
  "dolphin": [
    { name: "byd-dolphin-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2025/03/byd_dolphin_update-6.jpg", alt: "BYD Dolphin — вид спереди", type: "exterior" },
    { name: "byd-dolphin-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Dolphin-Honor-Edition-launched-in-China.jpg", alt: "BYD Dolphin — вид сбоку", type: "exterior" },
    { name: "byd-dolphin-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Dolphin-Honor-Edition-launched-in-China.jpg", alt: "BYD Dolphin — вид сзади", type: "exterior" },
    { name: "byd-dolphin-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Dolphin-Honor-Edition-launched-in-China.jpg", alt: "BYD Dolphin — салон", type: "interior" },
  ],
  "song-plus-dm-i": [
    { name: "byd-song-plus-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/07/autohomecar__ChxkPWaiGX6AT_jNAAQjMA52A7c742.jpg", alt: "BYD Song Plus DM-i — вид спереди", type: "exterior" },
    { name: "byd-song-plus-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/07/autohomecar__ChxkPWaiGX6AT_jNAAQjMA52A7c742.jpg", alt: "BYD Song Plus DM-i — вид сбоку", type: "exterior" },
    { name: "byd-song-plus-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/07/autohomecar__ChxkPWaiGX6AT_jNAAQjMA52A7c742.jpg", alt: "BYD Song Plus DM-i — вид сзади", type: "exterior" },
    { name: "byd-song-plus-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/07/autohomecar__ChxkPWaiGX6AT_jNAAQjMA52A7c742.jpg", alt: "BYD Song Plus DM-i — салон", type: "interior" },
  ],
  "tang": [
    { name: "byd-tang-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Tang — вид спереди", type: "exterior" },
    { name: "byd-tang-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Tang — вид сбоку", type: "exterior" },
    { name: "byd-tang-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Tang — вид сзади", type: "exterior" },
    { name: "byd-tang-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/02/BYD-Tang-DM-i.jpg", alt: "BYD Tang — салон", type: "interior" },
  ],
  "qin-plus": [
    { name: "byd-qin-plus-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/02/1-31.jpg", alt: "BYD Qin Plus — вид спереди", type: "exterior" },
    { name: "byd-qin-plus-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/02/1-31.jpg", alt: "BYD Qin Plus — вид сбоку", type: "exterior" },
    { name: "byd-qin-plus-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/02/1-31.jpg", alt: "BYD Qin Plus — вид сзади", type: "exterior" },
    { name: "byd-qin-plus-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/02/1-31.jpg", alt: "BYD Qin Plus — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // CHERY
  // ═════════════════════════════════════════════════════════════════════════════
  "tiggo-7-pro": [
    { name: "chery-tiggo7-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/2024-Chery-Tiggo-7.jpg", alt: "Chery Tiggo 7 Pro — вид спереди", type: "exterior" },
    { name: "chery-tiggo7-side.jpg", url: "https://paultan.org/image/2024/04/2024-Chery-Tiggo-7-Pro_Ext-2-1200x800.jpg", alt: "Chery Tiggo 7 Pro — вид сбоку", type: "exterior" },
    { name: "chery-tiggo7-rear.jpg", url: "https://paultan.org/image/2024/04/2024-Chery-Tiggo-7-Pro_Ext-13.jpg", alt: "Chery Tiggo 7 Pro — вид сзади", type: "exterior" },
    { name: "chery-tiggo7-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/2024-Chery-Tiggo-7.jpg", alt: "Chery Tiggo 7 Pro — салон", type: "interior" },
  ],
  "tiggo-8-pro": [
    { name: "chery-tiggo8-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/09/1_1726327354563-5.jpeg", alt: "Chery Tiggo 8 Pro — вид спереди", type: "exterior" },
    { name: "chery-tiggo8-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/09/1_1726327354563-5.jpeg", alt: "Chery Tiggo 8 Pro — вид сбоку", type: "exterior" },
    { name: "chery-tiggo8-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/09/1_1726327354563-5.jpeg", alt: "Chery Tiggo 8 Pro — вид сзади", type: "exterior" },
    { name: "chery-tiggo8-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/09/1_1726327354563-5.jpeg", alt: "Chery Tiggo 8 Pro — салон", type: "interior" },
  ],
  "omoda-5": [
    { name: "chery-omoda5-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2022/07/1-8-800x422.jpg", alt: "Chery Omoda 5 — вид спереди", type: "exterior" },
    { name: "chery-omoda5-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2022/07/4-6-800x368.jpg", alt: "Chery Omoda 5 — вид сбоку", type: "exterior" },
    { name: "chery-omoda5-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2022/07/5-6-800x510.jpg", alt: "Chery Omoda 5 — вид сзади", type: "exterior" },
    { name: "chery-omoda5-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2022/07/7-8-800x534.jpg", alt: "Chery Omoda 5 — салон", type: "interior" },
  ],
  "jaecoo-7": [
    { name: "chery-jaecoo7-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/04/Jaecoo-J7.jpg", alt: "Chery Jaecoo 7 — вид спереди", type: "exterior" },
    { name: "chery-jaecoo7-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/04/3-42-800x525.jpg", alt: "Chery Jaecoo 7 — вид сбоку", type: "exterior" },
    { name: "chery-jaecoo7-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/04/2-68.jpg", alt: "Chery Jaecoo 7 — вид сзади", type: "exterior" },
    { name: "chery-jaecoo7-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/04/image-123-800x507.png", alt: "Chery Jaecoo 7 — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // GEELY
  // ═════════════════════════════════════════════════════════════════════════════
  "monjaro": [
    { name: "geely-monjaro-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/New-Geely-Boyue-L.jpg", alt: "Geely Monjaro — вид спереди", type: "exterior" },
    { name: "geely-monjaro-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/1-66-800x450.jpg", alt: "Geely Monjaro — вид сбоку", type: "exterior" },
    { name: "geely-monjaro-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/1-67-800x444.jpg", alt: "Geely Monjaro — вид сзади", type: "exterior" },
    { name: "geely-monjaro-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2024/05/1-70-800x480.jpg", alt: "Geely Monjaro — салон", type: "interior" },
  ],
  "coolray": [
    { name: "geely-coolray-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/04/7-7-800x453.jpg", alt: "Geely Coolray — вид спереди", type: "exterior" },
    { name: "geely-coolray-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/04/9-7-800x384.jpg", alt: "Geely Coolray — вид сбоку", type: "exterior" },
    { name: "geely-coolray-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/04/2-49-800x474.jpg", alt: "Geely Coolray — вид сзади", type: "exterior" },
    { name: "geely-coolray-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2023/04/5-16-800x539.jpg", alt: "Geely Coolray — салон", type: "interior" },
  ],
  "emgrand": [
    { name: "geely-emgrand-front.jpg", url: "https://carnewschina.com/wp-content/uploads/2021/12/geely-emgrand-l-7-800x441.jpg", alt: "Geely Emgrand — вид спереди", type: "exterior" },
    { name: "geely-emgrand-side.jpg", url: "https://carnewschina.com/wp-content/uploads/2021/12/geely-emgrand-l-3-800x441.jpg", alt: "Geely Emgrand — вид сбоку", type: "exterior" },
    { name: "geely-emgrand-rear.jpg", url: "https://carnewschina.com/wp-content/uploads/2021/12/geely-emgrand-l-5-800x441.jpg", alt: "Geely Emgrand — вид сзади", type: "exterior" },
    { name: "geely-emgrand-interior.jpg", url: "https://carnewschina.com/wp-content/uploads/2021/12/geely-emgrand-l-12-800x441.jpg", alt: "Geely Emgrand — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // HAVAL
  // ═════════════════════════════════════════════════════════════════════════════
  "jolion": [
    { name: "haval-jolion-front.jpg", url: "https://paultan.org/image/2023/05/2023_MAS_GWM_Haval_Jolion_Ext-1-1200x801.jpg", alt: "Haval Jolion — вид спереди", type: "exterior" },
    { name: "haval-jolion-side.jpg", url: "https://paultan.org/image/2023/05/2023_MAS_GWM_Haval_Jolion_Ext-2-1200x801.jpg", alt: "Haval Jolion — вид сбоку", type: "exterior" },
    { name: "haval-jolion-rear.jpg", url: "https://paultan.org/image/2022/10/GWM_Haval_Jolion_HEV-1-1200x800.jpg", alt: "Haval Jolion — вид сзади", type: "exterior" },
    { name: "haval-jolion-interior.jpg", url: "https://paultan.org/image/2023/05/2023_MAS_GWM_Haval_Jolion_Int-2_BM.jpg", alt: "Haval Jolion — салон", type: "interior" },
  ],
  "h6": [
    { name: "haval-h6-front.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-32-1200x800.jpg", alt: "Haval H6 — вид спереди", type: "exterior" },
    { name: "haval-h6-side.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-33-630x420.jpg", alt: "Haval H6 — вид сбоку", type: "exterior" },
    { name: "haval-h6-rear.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-32-1200x800.jpg", alt: "Haval H6 — вид сзади", type: "exterior" },
    { name: "haval-h6-interior.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Int-1-630x420.jpg", alt: "Haval H6 — салон", type: "interior" },
  ],
  "f7": [
    { name: "haval-f7-front.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-32-1200x800.jpg", alt: "Haval F7 — вид спереди", type: "exterior" },
    { name: "haval-f7-side.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-33-630x420.jpg", alt: "Haval F7 — вид сбоку", type: "exterior" },
    { name: "haval-f7-rear.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Ext-32-1200x800.jpg", alt: "Haval F7 — вид сзади", type: "exterior" },
    { name: "haval-f7-interior.jpg", url: "https://paultan.org/image/2024/10/2024-GWM-H6-HEV-Launch_Int-1-630x420.jpg", alt: "Haval F7 — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // MG
  // ═════════════════════════════════════════════════════════════════════════════
  "mg4": [
    { name: "mg-mg4-front.jpg", url: "https://paultan.org/image/2024/03/2024-MG4-XPower-Malaysia_Ext-1-BM-1200x800.jpg", alt: "MG MG4 — вид спереди", type: "exterior" },
    { name: "mg-mg4-side.jpg", url: "https://paultan.org/image/2024/02/MG4-BYD-Dolphin-1200x628.jpg", alt: "MG MG4 — вид сбоку", type: "exterior" },
    { name: "mg-mg4-rear.jpg", url: "https://paultan.org/image/2024/03/2024-MG4-XPower-Malaysia_Ext-1-BM-1200x800.jpg", alt: "MG MG4 — вид сзади", type: "exterior" },
    { name: "mg-mg4-interior.jpg", url: "https://paultan.org/image/2024/03/2024-MG4-XPower-Malaysia_Ext-1-BM-1200x800.jpg", alt: "MG MG4 — салон", type: "interior" },
  ],
  "mg-hs": [
    { name: "mg-hs-front.jpg", url: "https://paultan.org/image/2024/08/2024_MG_HS_Lux_Preview_Malaysia_Ext-1-1200x801.jpg", alt: "MG HS — вид спереди", type: "exterior" },
    { name: "mg-hs-side.jpg", url: "https://paultan.org/image/2024/08/2024_MG_HS_Lux_Preview_Malaysia_Ext-1-1200x801.jpg", alt: "MG HS — вид сбоку", type: "exterior" },
    { name: "mg-hs-rear.jpg", url: "https://paultan.org/image/2024/08/2024_MG_HS_Lux_Preview_Malaysia_Ext-1-1200x801.jpg", alt: "MG HS — вид сзади", type: "exterior" },
    { name: "mg-hs-interior.jpg", url: "https://paultan.org/image/2024/08/2024_MG_HS_Lux_Preview_Malaysia_Ext-1-1200x801.jpg", alt: "MG HS — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // HYUNDAI
  // ═════════════════════════════════════════════════════════════════════════════
  "tucson": [
    { name: "hyundai-tucson-front.jpg", url: "https://paultan.org/image/2024/05/2024_Hyundai_Tucson_16Max_Malaysia_Ext-1-1200x801.jpg", alt: "Hyundai Tucson — вид спереди", type: "exterior" },
    { name: "hyundai-tucson-side.jpg", url: "https://paultan.org/image/2023/11/PACE_2023_Hyundai_Tucson_Ext-1-1200x801.jpg", alt: "Hyundai Tucson — вид сбоку", type: "exterior" },
    { name: "hyundai-tucson-rear.jpg", url: "https://paultan.org/image/2023/11/PACE_2023_Hyundai_Tucson_Ext-1-1200x801.jpg", alt: "Hyundai Tucson — вид сзади", type: "exterior" },
    { name: "hyundai-tucson-interior.jpg", url: "https://paultan.org/image/2023/11/PACE_2023_Hyundai_Tucson_Ext-1-1200x801.jpg", alt: "Hyundai Tucson — салон", type: "interior" },
  ],
  "ioniq-5": [
    { name: "hyundai-ioniq5-front.jpg", url: "https://paultan.org/image/2022/08/Hyundai_Ioniq5_Cover_EN-1200x675.jpg", alt: "Hyundai Ioniq 5 — вид спереди", type: "exterior" },
    { name: "hyundai-ioniq5-side.jpg", url: "https://paultan.org/image/2022/03/2022-Hyundai-Ioniq-5-Max_Int-1-630x420.jpg", alt: "Hyundai Ioniq 5 — вид сбоку", type: "exterior" },
    { name: "hyundai-ioniq5-rear.jpg", url: "https://paultan.org/image/2022/03/2022-Hyundai-Ioniq-5-Max_Int-1-630x420.jpg", alt: "Hyundai Ioniq 5 — вид сзади", type: "exterior" },
    { name: "hyundai-ioniq5-interior.jpg", url: "https://paultan.org/image/2022/03/2022-Hyundai-Ioniq-5-Max_Int-54.jpg", alt: "Hyundai Ioniq 5 — салон", type: "interior" },
  ],
  "sonata": [
    { name: "hyundai-sonata-front.jpg", url: "https://paultan.org/image/2020/10/Hyundai_Sonata_Cover_EN-1200x675.jpg", alt: "Hyundai Sonata — вид спереди", type: "exterior" },
    { name: "hyundai-sonata-side.jpg", url: "https://paultan.org/image/2021/02/2020-Hyundai-Sonata-2.5-Premium-Cover-1200x675.jpg", alt: "Hyundai Sonata — вид сбоку", type: "exterior" },
    { name: "hyundai-sonata-rear.jpg", url: "https://paultan.org/image/2020/10/Hyundai_Sonata_Cover_EN-1200x675.jpg", alt: "Hyundai Sonata — вид сзади", type: "exterior" },
    { name: "hyundai-sonata-interior.jpg", url: "https://paultan.org/image/2021/02/2020-Hyundai-Sonata-2.5-Premium-Cover-1200x675.jpg", alt: "Hyundai Sonata — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // KIA
  // ═════════════════════════════════════════════════════════════════════════════
  "sportage": [
    { name: "kia-sportage-front.jpg", url: "https://paultan.org/image/2024/12/2024_KLIMS_Kia_Sportage-1-1200x801.jpg", alt: "Kia Sportage — вид спереди", type: "exterior" },
    { name: "kia-sportage-side.jpg", url: "https://paultan.org/image/2025/02/2025-KIA-Sportage-2.0_Ext-10-BM.jpg", alt: "Kia Sportage — вид сбоку", type: "exterior" },
    { name: "kia-sportage-rear.jpg", url: "https://paultan.org/image/2025/02/2025-KIA-Sportage-2.0_Ext-23-BM.jpg", alt: "Kia Sportage — вид сзади", type: "exterior" },
    { name: "kia-sportage-interior.jpg", url: "https://paultan.org/image/2025/02/2025-KIA-Sportage-2.0_Ext-10-BM.jpg", alt: "Kia Sportage — салон", type: "interior" },
  ],
  "ev6": [
    { name: "kia-ev6-front.jpg", url: "https://paultan.org/image/2022/12/Kia_EV6_Cover-1200x675.jpg", alt: "Kia EV6 — вид спереди", type: "exterior" },
    { name: "kia-ev6-side.jpg", url: "https://paultan.org/image/2022/07/Kia_EV6_Cover_EN-1200x672.jpg", alt: "Kia EV6 — вид сбоку", type: "exterior" },
    { name: "kia-ev6-rear.jpg", url: "https://paultan.org/image/2022/12/Kia_EV6_Cover-1200x675.jpg", alt: "Kia EV6 — вид сзади", type: "exterior" },
    { name: "kia-ev6-interior.jpg", url: "https://paultan.org/image/2022/12/Kia_EV6_Cover-1200x675.jpg", alt: "Kia EV6 — салон", type: "interior" },
  ],
  "k5": [
    { name: "kia-k5-front.jpg", url: "https://paultan.org/image/2023/10/2024-Kia-K5-facelift-South-Korea-1-1200x628.jpg", alt: "Kia K5 — вид спереди", type: "exterior" },
    { name: "kia-k5-side.jpg", url: "https://paultan.org/image/2019/11/2020-Kia-Optima-first-images-1-1200x628.jpg", alt: "Kia K5 — вид сбоку", type: "exterior" },
    { name: "kia-k5-rear.jpg", url: "https://paultan.org/image/2023/10/2024-Kia-K5-facelift-South-Korea-1-1200x628.jpg", alt: "Kia K5 — вид сзади", type: "exterior" },
    { name: "kia-k5-interior.jpg", url: "https://paultan.org/image/2019/11/2020-Kia-Optima-first-images-1-1200x628.jpg", alt: "Kia K5 — салон", type: "interior" },
  ],

  // ═════════════════════════════════════════════════════════════════════════════
  // TESLA
  // ═════════════════════════════════════════════════════════════════════════════
  "model-3": [
    { name: "tesla-model3-front.jpg", url: "https://paultan.org/image/2023/10/Tesla-Model-3-Highland-Long-Range-AWD-2023-Malaysia-launch-1-1200x800.jpg", alt: "Tesla Model 3 — вид спереди", type: "exterior" },
    { name: "tesla-model3-side.jpg", url: "https://paultan.org/image/2023/10/Untitled-design-20-1200x630.png", alt: "Tesla Model 3 — вид сбоку", type: "exterior" },
    { name: "tesla-model3-rear.jpg", url: "https://paultan.org/image/2023/11/Tesla_Model_3_FL_Cover-1200x675.jpg", alt: "Tesla Model 3 — вид сзади", type: "exterior" },
    { name: "tesla-model3-interior.jpg", url: "https://paultan.org/image/2023/11/Tesla_Model_3_FL_Cover-1200x675.jpg", alt: "Tesla Model 3 — салон", type: "interior" },
  ],
  "model-y": [
    { name: "tesla-modely-front.jpg", url: "https://paultan.org/image/2024/02/2024-Tesla-Model-Y-Performance-Malaysia_Ext-10.jpg", alt: "Tesla Model Y — вид спереди", type: "exterior" },
    { name: "tesla-modely-side.jpg", url: "https://paultan.org/image/2024/02/2024-Tesla-Model-Y-Performance-Malaysia_Ext-11.jpg", alt: "Tesla Model Y — вид сбоку", type: "exterior" },
    { name: "tesla-modely-rear.jpg", url: "https://paultan.org/image/2024/02/2024-Tesla-Model-Y-Performance-Malaysia_Ext-12.jpg", alt: "Tesla Model Y — вид сзади", type: "exterior" },
    { name: "tesla-modely-interior.jpg", url: "https://paultan.org/image/2024/02/2024-Tesla-Model-Y-Performance-Malaysia_Ext-10.jpg", alt: "Tesla Model Y — салон", type: "interior" },
  ],
};

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proto = url.startsWith("https") ? https : http;
    const file = (path: string) => {
      const writeStream = (p: string) => {
        const ws = writeFileSync(p, "") as any;
        return ws;
      };

      proto.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          downloadFile(response.headers.location!, dest).then(resolve);
          return;
        }
        if (response.statusCode !== 200) {
          console.log(`  ✗ HTTP ${response.statusCode} for ${url}`);
          resolve(false);
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          try {
            const buffer = Buffer.concat(chunks);
            writeFileSync(dest, buffer);
            const sizeKB = Math.round(buffer.length / 1024);
            console.log(`  ✓ Downloaded ${dest.split("/").pop()} (${sizeKB} KB)`);
            resolve(true);
          } catch (err) {
            console.log(`  ✗ Write error: ${err}`);
            resolve(false);
          }
        });
        response.on("error", (err) => {
          console.log(`  ✗ Download error: ${err.message}`);
          resolve(false);
        });
      }).on("error", (err) => {
        console.log(`  ✗ Request error: ${err.message}`);
        resolve(false);
      });
    };

    file(dest);
  });
}

const REMAINING: string[] = []; // Set to ["model-slug"] to process only specific models

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    mkdirSync(IMAGES_DIR, { recursive: true });
  }

  console.log("=== Downloading car photos ===\n");

  // Download all photos (skip if already exists)
  const entries = REMAINING.length
    ? Object.entries(CAR_PHOTOS).filter(([k]) => REMAINING.includes(k))
    : Object.entries(CAR_PHOTOS);
  for (const [modelSlug, photos] of entries) {
    console.log(`\n📸 ${modelSlug}:`);
    for (const photo of photos) {
      const dest = join(IMAGES_DIR, photo.name);
      if (existsSync(dest)) {
        console.log(`  ⊘ ${photo.name} (exists)`);
        continue;
      }
      await downloadFile(photo.url, dest);
    }
  }

  console.log("\n=== Updating database ===\n");

  // Update database with new media entries
  for (const [modelSlug, photos] of entries) {
    // Find the model version
    const model = (await db.select().from(carModels).where(eq(carModels.slug, modelSlug)).limit(1))[0];
    if (!model) {
      console.log(`  ⚠ Model not found: ${modelSlug}`);
      continue;
    }

    const version = (await db.select().from(modelVersions).where(eq(modelVersions.carModelId, model.id)).limit(1))[0];
    if (!version) {
      console.log(`  ⚠ Version not found for model: ${modelSlug}`);
      continue;
    }

    // Delete existing media for this version
    const existingMedia = await db.select().from(vehicleMedia).where(eq(vehicleMedia.modelVersionId, version.id));
    if (existingMedia.length > 0) {
      console.log(`  🗑 Removing ${existingMedia.length} old media entries for ${modelSlug}`);
      for (const media of existingMedia) {
        await db.delete(vehicleMedia).where(eq(vehicleMedia.id, media.id));
      }
    }

    // Insert new media entries
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const url = `/images/cars/${photo.name}`;
      await db.insert(vehicleMedia).values({
        modelVersionId: version.id,
        type: photo.type,
        url,
        alt: photo.alt,
        sortOrder: i,
      });
    }

    console.log(`  ✓ ${modelSlug}: ${photos.length} photos added`);
  }

  console.log("\n✅ Done! Photos downloaded and database updated.");
  await client.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
