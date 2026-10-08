// Source-linked official uploads. Playback availability is checked by the standard YouTube player.
const grind='https://jr.nba.com/jr-nba-the-grind-series/';
const heritage='https://www.fiba.basketball/en/news/berlin-calling-the-womens-world-cup-stories-you-need-to-see';
const boysGame='https://www.fiba.basketball/en/history/276-fiba-u19-basketball-world-cup/208299/games/104147-USA-FRA';
const girlsGame='https://www.fiba.basketball/en/events/fiba-u19-womens-basketball-world-cup-2025/games/126690-USA-FRA';
const entries=[
 ['wnba-best','y1gthAt8FgU','Best of WNBA: First Half of 2025','WNBA','Girls','Game Highlights','A collection of plays from the first half of the 2025 WNBA season.','https://www.youtube.com/@WNBA'],
 ['u19-boys-final','vMuyG9WmCeY','USA vs Germany: U19 Final Highlights','FIBA Basketball','Boys','Game Highlights','Extended highlights from the 2025 U19 World Cup final.','https://www.youtube.com/@FIBA'],
 ['u19-girls-final','HQz9pFdNKYY','USA vs Australia: U19 Women’s Final','FIBA Basketball','Girls','Game Highlights','Extended highlights from the 2025 U19 women’s final.','https://www.youtube.com/@FIBA'],
 ['u19-boys-france','FZInzf49yPc','USA vs France: U19 Final Highlights','FIBA Basketball','Boys','Game Highlights','Highlights from the 2021 U19 World Cup final.','https://www.youtube.com/@FIBA',boysGame],
 ['u19-girls-france','SXiAHVCsxEU','USA vs France: U19 Women’s Highlights','FIBA Basketball','Girls','Game Highlights','Highlights from the 2025 women’s U19 quarter-final.','https://www.youtube.com/@FIBA',girlsGame],
 ['scoot-story','hSCQ6zzc3uI','The Grind: Scoot Henderson','Jr. NBA','Boys','Player Stories','Meet the player behind the practice. Scoot works with coach Jeremiah Boswell.','https://www.youtube.com/@jrnba',grind],
 ['copper-story','f6j2sd4YZ_s','The Grind: Kahleah Copper','Jr. NBA','Girls','Player Stories','Kahleah Copper shares her game and approach to improving.','https://www.youtube.com/@jrnba',grind],
 ['arike-story','G1h6OEuR39w','The Grind: Arike Ogunbowale','Jr. NBA','Girls','Player Stories','A look inside Arike Ogunbowale’s work with coach Jeremiah Boswell.','https://www.youtube.com/@jrnba',grind],
 ['huerter-story','NDcpG1UDKfk','The Grind: Kevin Huerter','Jr. NBA','Boys','Player Stories','Kevin Huerter talks about his off-season routine.','https://www.youtube.com/@jrnba',grind],
 ['bones-story','aq0H4TbZ2FA','The Grind: Bones Hyland','Jr. NBA','Boys','Player Stories','Bones Hyland shares the preparation behind his season.','https://www.youtube.com/@jrnba',grind],
 ['women-world-cup','YjatN9Dxkfs','The World on Our Shoulders','FIBA Basketball','Girls','History','The story of the Women’s World Cup, from pioneers to modern icons.','https://www.youtube.com/@FIBA',heritage],
 ['world-cup-history','mDxrdWZOTpM','The History of the FIBA Basketball World Cup','FIBA Basketball','Boys','History','FIBA’s documentary on the history of its men’s World Cup.','https://www.youtube.com/@FIBA','https://www.fiba.basketball/en/news/basketballworldcup-2023-news-where-and-how-to-watch-revamped-world-cup-documentary-with-previews-from-melo'],
 ['nigeria-history','Sar9pBurcxY','Uncovered: Nigeria vs Greece, 2018','FIBA Basketball','Girls','History','Revisit a milestone in Nigeria’s Women’s World Cup journey.','https://www.youtube.com/@FIBA',heritage],
 ['usa-czechia-history','e4CaU8ILOlg','Uncovered: USA vs Czechia, 2010','FIBA Basketball','Girls','History','A look back at a memorable Women’s World Cup matchup.','https://www.youtube.com/@FIBA',heritage],
 ['opals-history','IWIP1Azs3Ts','Uncovered: The Magical Run of the Opals','FIBA Basketball','Girls','History','Return to Australia’s 2006 Women’s World Cup run.','https://www.youtube.com/@FIBA',heritage],
 ['boys-broadcast','V1DHq7tjriI','USA vs France: U19 Final Broadcast','FIBA Basketball','Boys','Live & Upcoming','Full-game replay · 2021 U19 World Cup final.','https://www.youtube.com/@FIBA',boysGame],
 ['girls-broadcast','0PGZ7CLvB8I','USA vs France: U19 Women’s Broadcast','FIBA Basketball','Girls','Live & Upcoming','Full-game replay · 2025 U19 women’s quarter-final.','https://www.youtube.com/@FIBA',girlsGame]
];
export const videos=entries.map(([id,youtube,title,creator,audience,category,description,channel,reference])=>({id,youtube,title,creator,audience,category,description,channel,reference,source:'https://www.youtube.com/watch?v='+youtube,status:category==='Live & Upcoming'?'Replay':'On demand'}));
export const viewing=videos;
export const findVideo=id=>videos.find(v=>v.id===id);
