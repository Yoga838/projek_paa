import prisma from '../../lib/prisma'

import { verify,sign } from "jsonwebtoken";
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = 'My-Lover';

export default async function handler(req, res) {
    if (req.method === "POST") {
        
        const {id,token} = req.body;
        const decode = verify(token,JWT_SECRET);
        
        const decodedToken = verify(token, JWT_SECRET);
        const { userId } = decodedToken;
        
        const datadiri = await prisma.akun.findUnique({where:{id:Number(userId)}})
        const dataanak = await prisma.data.findUnique({
            where:{id:Number(id)}
        })
        const date = dataanak.tanggal_lahir_ibu
        const date2 = dataanak.tanggal_meninggal_ibu;
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        const tanggal_lahir_ibu = date.toLocaleDateString('id-ID', options);
        const tanggal_meninggal_ibu = date2.toLocaleDateString('id-ID', options);
         // Baca template dokumen
         const template = fs.readFileSync(path.resolve('public', 'skk.docx'), 'binary');

         const zip = new PizZip(template)
         // Inisialisasi Docxtemplater
         const doc = new Docxtemplater(zip, {
             paragraphLoop: true,
             linebreaks: true,
         });
         const data = {
            "desa":datadiri.desa,
            "nama":dataanak.nama_ibu,
            "tempat_lahir":dataanak.tempat_lahir_ibu,
            "tanggal_lahir":tanggal_lahir_ibu,
            "jenis_kelamin":dataanak.jenis_kelamin_ibu,
            "umur":dataanak.umur_ibu,
            "hari_meninggal":dataanak.hari_meninggal_ibu,
            "tanggal_meninggal":tanggal_meninggal_ibu,
            "meninggal_karena":dataanak.meninggal_karena_ibu,
            "kabupaten":datadiri.kabupaten
         }
 
         // Ganti kolom kosong dengan data dari JSON
         doc.render(data);
 
         // Simpan dokumen yang dihasilkan
         const buffer = doc.getZip().generate({
             type: "nodebuffer",
             // compression: DEFLATE adds a compression step.
             // For a 50MB output document, expect 500ms additional CPU time
             compression: "DEFLATE",
         });
         res.setHeader('Content-Disposition', 'attachment; filename=output.docx');
         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
         res.send(buffer);
    }
}