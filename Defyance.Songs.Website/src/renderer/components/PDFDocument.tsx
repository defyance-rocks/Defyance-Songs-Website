import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Path } from '@react-pdf/renderer';
import { Song } from '../../shared/models';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: '40pt 60pt',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: '20pt',
    textAlign: 'center',
  },
  minimalHeader: {
    marginBottom: '10pt',
    textAlign: 'left',
  },
  bandName: {
    fontSize: '20pt',
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '2pt',
  },
  title: {
    fontSize: '34pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  minimalTitle: {
    fontSize: '20pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '20pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#333333',
    marginTop: '2pt',
  },
  minimalSubtitle: {
    fontSize: '16pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#333333',
    marginTop: '2pt',
  },
  songList: {
    marginTop: '10pt',
  },
  songItem: {
    marginBottom: '6pt',
    flexDirection: 'row',
    alignItems: 'center',
  },
  songNumber: {
    width: '35pt',
    color: '#999999',
    fontSize: '28pt',
    fontWeight: 'bold',
  },
  minimalSongNumber: {
    width: '35pt',
    color: '#999999',
    fontSize: '24pt',
    fontWeight: 'bold',
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  songName: {
    fontSize: '28pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    maxLines: 1,
    textOverflow: 'ellipsis',
  },
  minimalSongName: {
    fontSize: '24pt',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    maxLines: 1,
    textOverflow: 'ellipsis',
  },
  linkIconContainer: {
    marginLeft: '30pt', // Approx 2em equivalent for 28pt font
    width: '20pt',
    height: '20pt',
  },
  footer: {
    position: 'absolute',
    bottom: '30pt',
    left: '60pt',
    right: '60pt',
    borderTop: '1pt solid #cccccc',
    paddingTop: '10pt',
    fontSize: '10pt',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  }
});

const ArrowDown = () => (
  <Svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
    <Path 
      d="M12 21l-7-7h4V4h6v10h4l-7 7z" 
      stroke="#333333" 
      strokeWidth="2.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </Svg>
);

const truncateToWord = (text: string, isDated: boolean, hasArrow: boolean) => {
    const limit = isDated ? (hasArrow ? 22 : 28) : (hasArrow ? 28 : 35);
    if (text.length <= limit) return text;
    const sub = text.substring(0, limit);
    const lastSpace = sub.lastIndexOf(' ');
    return (lastSpace > 2 ? sub.substring(0, lastSpace) : sub) + '...';
};

interface PDFDataset {

  songs: Song[];
  h1: string;
  h2?: string;
  h3?: string;
  isDated: boolean;
}

interface PDFDocumentProps {
  datasets: PDFDataset[];
  highVis?: boolean;
}

export const SetlistPDF: React.FC<PDFDocumentProps> = ({ datasets }) => {
  const docTitle = datasets[0]?.h1 || 'Setlist';
  const bandName = "Defyance";

  return (
    <Document 
        title={docTitle} 
        author={bandName} 
        creator={bandName}
        producer={bandName}
        subject={datasets[0]?.h2 || "Band Setlist"}
    >
      {datasets.map((data, dsIndex) => {
        const hasHighRange = data.songs.some(s => s.vocalRange === 'High');
        return (
          <Page key={dsIndex} size="LETTER" style={styles.page}>
            <View style={data.isDated ? styles.header : styles.minimalHeader}>
              {data.isDated && <Text style={styles.bandName}>Defyance</Text>}
              <Text style={data.isDated ? styles.title : styles.minimalTitle}>{data.h1}</Text>
              {(data.h2 || data.h3) && (
                <Text style={data.isDated ? styles.subtitle : styles.minimalSubtitle}>
                  {data.h2}{data.h2 && data.h3 ? ' • ' : ''}{data.h3}
                </Text>
              )}
            </View>

            <View style={styles.songList}>
              {data.songs.map((song, index) => (
                <View key={song.id + index} style={styles.songItem} wrap={false}>
                  <Text style={data.isDated ? styles.songNumber : styles.minimalSongNumber}>{index + 1}</Text>
                  <View style={styles.songContent}>
                    <Text 
                        style={data.isDated ? styles.songName : styles.minimalSongName}
                    >
                        {`${truncateToWord(song.name, data.isDated, !!song.linked_to)}${song.vocalRange === 'High' ? '*' : ''}`}
                    </Text>
                    {song.linked_to && (
                      <View style={styles.linkIconContainer}>
                        <ArrowDown />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.footer} fixed>
              {hasHighRange && <Text>*DETUNE</Text>}
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
