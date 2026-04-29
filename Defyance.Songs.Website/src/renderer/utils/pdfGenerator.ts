import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { supabase } from '../supabase';
import { SetlistPDF } from '../components/PDFDocument';
import { PDFDataset } from './pdfPrepare';

export const generateAndOpenPDF = async (datasets: PDFDataset[], highVis: boolean = false) => {
    if (datasets.length === 0) return;

    try {
        // We create the element here. Note: react-pdf components are just data structures 
        // until they are passed to the renderer, so this is lightweight.
        const doc = React.createElement(SetlistPDF, { datasets, highVis });
        
        // Generate the blob. Cast to any because react-pdf type definitions 
        // for pdf() are sometimes incompatible with wrapped functional components.
        const blob = await pdf(doc as any).toBlob();
        const filename = `${datasets[0].h1.replace(/\s+/g, '_')}.pdf`;
        
        // Upload to Supabase Storage to get a REAL URL (solves Edge/Safari name issues)
        const { error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(filename, blob, { 
                contentType: 'application/pdf',
                upsert: true 
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('pdfs')
            .getPublicUrl(filename);

        window.open(publicUrl, '_blank');
    } catch (err) {
        console.error('[PDF Generator] Failed:', err);
        throw err;
    }
};
