// Only official source-linked uploads. Embedding is checked at playback; never rehost.
export const videos = [
 {id:'pound-control',youtube:'esyfJhH3NWU',title:'1-Ball Pound 1-Ball Control Drill',creator:'Jr. NBA / Jeremiah Boswell',source:'https://jr.nba.com/video/1-ball-pound-1-ball-control-drill/',channel:'https://www.youtube.com/@jrnba',skill:'Ball handling'},
 {id:'cross-breakdown',youtube:'m6Mv2467mPs',title:'In and Out Crossover Breakdown Drill',creator:'Jr. NBA / Jeremiah Boswell',source:'https://jr.nba.com/video/in-out-crossover-breakdown-drill/',channel:'https://www.youtube.com/@jrnba',skill:'Ball handling'},
 {id:'cross-shot',youtube:'ajAQJRkSkIo',title:'In and Out Crossover and Shoot Drill',creator:'Jr. NBA / Jeremiah Boswell',source:'https://jr.nba.com/video/in-and-out-crossover-and-shoot-drill/',channel:'https://www.youtube.com/@jrnba',skill:'Shooting'},
 {id:'step-form',youtube:'Izm5IpoOGbM',title:'1-Step Form Shooting',creator:'Jr. NBA / Dale Ellis',source:'https://jr.nba.com/video/1-step-form-shooting/',channel:'https://www.youtube.com/@jrnba',skill:'Shooting'},
 {id:'two-ball',youtube:'6nfnBHvDkRk',title:'Stationary 2-Ball Dribble Drill (Same Time)',creator:'Jr. NBA / Jeremiah Boswell',source:'https://jr.nba.com/video/stationary-2-ball-dribble-drill-same-time-adds-lowmiddlehigh/',channel:'https://www.youtube.com/@jrnba',skill:'Ball handling'},
 {id:'pass-cut',youtube:'YzadRKLSMB4',title:'Pass and Cut Drill',creator:'Jr. NBA / Kiesha Brown',source:'https://jr.nba.com/video/pass-and-cut-drill/',channel:'https://www.youtube.com/@jrnba',skill:'Game IQ'},
 {id:'scoot-story',youtube:'hSCQ6zzc3uI',title:'The Grind Series: Scoot Henderson',creator:'Jr. NBA',source:'https://jr.nba.com/jr-nba-the-grind-series/',channel:'https://www.youtube.com/@jrnba',category:'Player Stories',audience:'Boys',stage:'Teen'},
];
export const viewing = [
 {id:'wnba-highlights',category:'Game Highlights',title:'WNBA highlights',description:'Official highlights and game moments from the women’s league.',source:'https://www.youtube.com/@WNBA',creator:'WNBA',audience:'Girls',stage:'Teen',kind:'channel'},
 {id:'fiba-highlights',category:'Game Highlights',title:'International basketball',description:'Explore official FIBA highlights and youth competition coverage.',source:'https://www.youtube.com/FIBA',creator:'FIBA Basketball',audience:'All Players',stage:'Teen',kind:'channel'},
 {id:'scoot-story',category:'Player Stories',title:'The Grind: Scoot Henderson',description:'A look at preparation and player development through Jr. NBA’s original series.',video:'scoot-story',creator:'Jr. NBA',audience:'Boys',stage:'Teen'},
 {id:'aja-story',category:'Player Stories',title:'A’ja Wilson: A Champ’s Diary',description:'A’ja Wilson reflects on a championship journey in the WNBA’s own series.',source:'https://www.wnba.com/watch/video/maevp-a-champaes-diary-episode-4',creator:'WNBA',audience:'Girls',stage:'Teen',kind:'source'},
 {id:'origins',category:'History',title:'The beginnings of basketball',description:'Historic newspapers and research from the Library of Congress.',source:'https://guides.loc.gov/chronicling-america-basketball',creator:'Library of Congress',audience:'All Players',stage:'All',kind:'archive'},
 {id:'women-history',category:'History',title:'Women in early basketball',description:'Explore women’s basketball through historic images and archival context.',source:'https://blogs.loc.gov/picturethis/2016/03/women-hoopsters/',creator:'Library of Congress',audience:'Girls',stage:'All',kind:'archive'},
 {id:'live',category:'Live & Upcoming',title:'Official FIBA streams',description:'Check the official channel for available streams. Schedules and regional access vary.',source:'https://www.youtube.com/FIBA/streams',creator:'FIBA Basketball',audience:'All Players',stage:'All',kind:'live-directory'}
];
export const findVideo=id=>videos.find(v=>v.id===id);
