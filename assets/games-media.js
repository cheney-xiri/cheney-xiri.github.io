/* 官方商店与发行方图片。外部资源不可用时，界面会保留文字标识。 */
const apple = path => `${path.replace(/\/1200x630wa\.(?:png|jpg)$/,'')}/512x512bb.png`;
const steam = id => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`;
window.CHENEY_GAME_MEDIA = {
  'wzry': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/2e/20/e7/2e20e7d1-5556-02be-eb9e-1eb0cfcf024c/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/1200x630wa.png'), kind:'icon' },
  'cfm': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b5/22/60/b5226028-e44c-0c42-17e6-c62089dedf4c/AppIcon-1x_U007emarketing-0-10-0-85-220-0.png/1200x630wa.jpg'), kind:'icon' },
  'qqspeed': { src: apple('https://is4-ssl.mzstatic.com/image/thumb/Purple112/v4/ea/70/82/ea7082b7-b5ce-c4a1-96b9-aae13f68af4e/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png'), kind:'icon' },
  'delta-mobile': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d3/b0/5c/d3b05c30-be92-2b32-e4cc-676407757f35/AppIcon-1x_U007emarketing-0-7-0-85-220-0.png/1200x630wa.png'), kind:'icon' },
  'simcity': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/67/71/f7/6771f79e-11ae-b2b5-801d-820a3d772e03/AppIcon-1x_U007epad-0-85-220-0.png/1200x630wa.png'), kind:'icon' },
  'mini-world': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/fe/96/02/fe96025f-b5cc-3d63-67e0-c47235e44030/AppIcon-0-0-1x_U007emarketing-0-11-0-0-85-220.png/1200x630wa.png'), kind:'icon' },
  'lol-mobile': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ea/58/99/ea5899e0-cdc5-b3e0-c5b2-0b2a4dde4b57/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/1200x630wa.png'), kind:'icon' },
  'nsh-mobile': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/16/8d/1b/168d1b67-748f-6bcb-edba-66a06f9a6252/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/1200x630wa.png'), kind:'icon' },
  'happy-elimination': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/15/2c/a1/152ca19c-1541-3de9-9c55-318ccf5ed357/AppIcon-1x_U007emarketing-0-10-0-0-85-220-0.png/1200x630wa.png'), kind:'icon' },
  'golden-spatula': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/1e/62/31/1e6231e8-9af0-a02b-c231-6bcf214b52e6/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png'), kind:'icon' },
  'lost-city': { src: apple('https://is1-ssl.mzstatic.com/image/thumb/Purple122/v4/1c/81/e7/1c81e77b-1bd8-5892-72cf-88768b60d603/AppIcon-1x_U007emarketing-0-7-85-220.png/1200x630wa.png'), kind:'icon' },
  'egg-party': { src:'https://www.eggyparty.com/m/zt/20230709180438/img/enIcon_eab7a30.png', kind:'icon' },
  'rusted-warfare': { src:steam(647960), kind:'cover' },
  'pokemon': { src:'https://asia-press.portal-pokemon.com/public_assets/images/og-image.png', kind:'logo' },
  'delta-pc': { src:steam(2507950), kind:'cover' },
  'where-winds-meet': { src:steam(3564740), kind:'cover' },
  'valorant': { src:'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/d0db663bf28844dcbd744935cdd8c71083e0031c-5600x3150.jpg?w=600', kind:'logo' },
  'cf-pc': { src:'https://m.smilegate.com/assets/img/game/crossfire/logo%402x.png', kind:'logo' },
  'it-takes-two': { src:steam(1426210), kind:'cover' },
  'split-fiction': { src:steam(2001120), kind:'cover' },
  'car-mechanic': { src:steam(645630), kind:'cover' },
  'csgo': { src:steam(730), kind:'cover' },
  '8am': { src:steam(2835590), kind:'cover' },
  'house-flipper': { src:steam(613100), kind:'cover' },
  'mushroom-day': { src:steam(1590840), kind:'cover' },
  'outlast-trials': { src:steam(1304930), kind:'cover' },
  'world-warships': { src:steam(552990), kind:'cover' },
  'living-forest': { src:steam(3027490), kind:'cover' },
  'arena-breakout': { src:steam(2073620), kind:'cover' }
};
