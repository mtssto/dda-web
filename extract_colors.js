const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function getDominantColor(imagePath) {
    try {
        const img = await loadImage(imagePath);
        // Resize to 50x50 to speed up calculation
        const canvas = createCanvas(50, 50);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            // Ignore transparent or near-white pixels
            if (a < 128 || (r > 240 && g > 240 && b > 240)) continue;

            rTotal += r;
            gTotal += g;
            bTotal += b;
            count++;
        }

        if (count === 0) return { h: 0, s: 0, l: 0 };

        const rAvg = rTotal / count;
        const gAvg = gTotal / count;
        const bAvg = bTotal / count;

        // Convert to HSL
        const rNorm = rAvg / 255;
        const gNorm = gAvg / 255;
        const bNorm = bAvg / 255;

        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    } catch (e) {
        console.error(`Error processing ${imagePath}:`, e.message);
        return { h: 0, s: 0, l: 0 };
    }
}

async function main() {
    console.log("Starting color extraction via Canvas...");
    const imageColors = {};
    const navesDir = "portfolio/sections/Las Naves";
    const ilusDir = "Ilustrates";

    // Las Naves 1-11
    for (let i = 1; i <= 11; i++) {
        const path = `${navesDir}/${i}.jpg`;
        if (fs.existsSync(path)) {
            imageColors[path] = await getDominantColor(path);
        }
    }

    // Ilustrates dibu*
    const dibus = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27];
    for (let i of dibus) {
        let path = `${ilusDir}/dibu${i}.jpg`;
        if (!fs.existsSync(path) && i >= 21 && i <= 23) {
            path = `${ilusDir}/dibu${i}.jpeg`;
        }
        if (fs.existsSync(path)) {
            imageColors[path] = await getDominantColor(path);
        }
    }

    fs.writeFileSync('image_colors.json', JSON.stringify(imageColors, null, 2));
    console.log("Done! Results saved to image_colors.json");
}

main();
