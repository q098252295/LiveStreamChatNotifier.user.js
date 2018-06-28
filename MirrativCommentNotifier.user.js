// ==UserScript==
// @name               MirrativCommentNotifier.user.js
// @description        Mirrativのライブチャットのストリームで特定のメッセージを通知してくれるやつ
// @namespace          https://github.com/syusui-s/MirrativCommentNotifier.user.js
// @version            1.0.0
// @match              https://www.mirrativ.com/live/*
// @run-at             document-end
// @downloadURL        https://github.com/syusui-s/YouTubeCommentNotifier.user.js/raw/master/MirrativCommentNotifier.user.js
// @updateURL          https://github.com/syusui-s/YouTubeCommentNotifier.user.js/raw/master/MirrativCommentNotifier.user.js
// @grant              GM.notification
// ==/UserScript==

/**
 * 指定のミリ秒 ms だけ、何もしないで待機する
 *
 * @param {number} ms 待機ミリ秒
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 処理を再試行する async function
 *
 * @param {number}   count    再試行の最大回数
 * @param {number}   interval 次の再試行までの間隔をミリ秒で指定する
 * @param {function} fn       処理
 * @param {array}    args     処理への引数
 */
const retry = async (count, interval, fn, ...args) => {
  for (let i = 0; i < count; ++i) {
    const result = await fn(...args);

    if (result)
      return result;

    await sleep(interval);
  }
};

const notifySound = {
  audio: new Audio('data:audio/mp3;base64,//NExAANmAJeX0EQAPYpJqm5HQa3Pg/Eb4IRAcdLvtLggcdKOgg4EAQdKO/iM//KBj//ygY/lz/1AgA/xAGP//y/g+oKv/vry70DwEDwHgPobBpRKnCxUZEJ4FAKALyr//NExBwZJAqNlYdQAGrIBXBvzDWICxaeLjx+XAFgCxvt6FuBUBsb85/IzH9hEf////+ehL0M6kQxMTYt7AJj4kFsfl2/////+ur2/////+lf//6DwkqngR65QuV1JP////NExAoUFAqoAYJoAF68ZgEYVFsT8C/P5cE5E7PIooqSS/Wv9Zv+f9Sfb//+//yqFn/8Ros/8eoWAwf71of/X22/+Z//+xwpnv/6veYkD/9X1ZOqG+/24SlADg3qxwQh//NExAwUCm7qX8IoAs7ojDRnFAmB0dhUSESOLf/0EgGD4cEwOHw4OUw7/kOQ5isYxn//////////0MZhIPDRQeOFxAwoD44EAyIF7f////qIVQZYl9tgEBP+z/ZYFQHD//NExA4UeRa2+DAfINAeoDu7u7z3t+dlq3z9z/Fm1W7N0+g6hii/EIQkesQwXAegljCrw4b//MAqIQIPAgYWDDv//1TATATyQdCRkyZGp//auu1u2ALgAEhk6P9hwhbC//NExA8T8XruXhgTJjzz+SltQRGm/Tp//1v/tCgA0DoUFArCgfPhRkLisSLo0eqCgUJiiLahl3////////h1rAqAgkHjJkBhEiAwYJhiGt21kkACCD9jVlWEENUPL6Xy//NExBIWGbayXBnTZBlS8jJWvrsxxjKPnka///xDAcHiELAkCQJAkCRoQgiuCIeHgyNDYCAHEYODJMJAvIktgFwsA3hggQB9584fGyP/9UreueK1AFAAFikA/7D///5c//NExAwOqp72RggNUpF6O////+z+vPp8lnwONJESRJEcMJghaQQIRCzFE1mIGEHPsCAgfBAEAQBMH/y6v+32GAAoAFximAUJBM4sdymKowTYjUVSTt+dSJKv//////1///NExCQPO67+XigHzv9WJmUmNWVqjKhqFDVHEDiRQoSwzo4ABge3/fb/7XWi0Z2TYOysk+7i0aLrZMpscy7hnslQ0OwPMl+le/tSPNZeH5EzMJobPB1YGKhos6Vdfu6P//NExDoSaU7uXgmGEqlf/6ImMpc6pfFf/mqi8CI4v2QIkG4EBH0JPEcIe0JZYXiUlW0anDCzD4q8RyMMmK7vib5k+T/U1KQnwh//////6//9ssqKxikr//f////9WTyl//NExEMSC6KA8EBE/WDHEkDN1QkwBUFpH4MYnqgOIlJ6oxCla2OT2FDne43FhXiwiYSr/8mmpGszWGsNbDWGTBTJqTezUmsMBDAgaGjwq/////7No///7tX32gUyPVTP//NExE0SeXY0AHhG6Ov/+Kf7etv8WFf4q3i7MW4qKN/FhdmsW1inFhX9YqLdbKhZmsUb+LC7O3FRTi1MQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMu//NExFYMOAGgDAhEADEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExHgAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NExKwAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'),

  play() {
    this.audio.play();
  },
};

/**
 * 内部実装としてMapを使うSet
 */
class MapSet {
  constructor(...items) {
    const map = new Map();
    items.forEach(item => map.set(item, true));

    this.map = map;
  }

  has(item) {
    return this.map.has(item);
  }
}

/**
 * ライブストリームに流れるメッセージ
 */
class Message {
  /**
   * @param {string}  author    投稿者名
   * @param {string}  iconUrl   投稿者のアイコン
   * @param {string}  body      メッセージの本体
   */
  constructor(author, iconUrl, body) {
    Object.assign(this, { author, iconUrl, body, });
  }

  /**
   * メッセージの投稿者名が引数のMapSetに含まれているならtrueを返す
   *
   * @param {MapSet} names 投稿者名のMapSet
   * @return {boolean} 含まれているかどうか
   */
  hasNameSome(names) {
    return names.has(this.author);
  }
}

class NotifierGM {
  notify(message) {
    // HACK スパチャなどで本文が空の場合に備えて、各テキストに空白文字を追加している
    // GM.notification は、textが空だと通知してくれないんですよね
    GM.notification({
      title: message.author,
      text: `${message.body} `,
      image: message.iconUrl,
    });
  }

  async requestPermission() {
    return true;
  }

  supported() {
    return 'GM' in window && 'notification' in window.GM;
  }
}

class NotifierNotificationAPI {
  notify(message) {
    new Notification(message.author, {
      body: message.body,
      icon: message.iconUrl,
    });
  }

  async requestPermission() {
    const result = await Notification.requestPermission();

    return result === 'granted';
  }

  supported() {
    return 'Notification' in window;
  }
}

/**
 * 通知に関する処理を置いておく Domain Service
 */
class NotificationService {
  /**
   * @param {Notifier}      notifier           通知を提供するサービス
   * @param {object}        notifySound        通知音を鳴らしてくれるような仕組みを持つオブジェクト
   * @param {MapSet}        authorNames        通知したい投稿者名の配列
   */
  constructor(notifier, notifySound, authorNames) {
    Object.assign(this, { notifier, notifySound, authorNames });
  }

  /**
   * 指定のメッセージを条件に従って通知します
   *
   * @param {Message} message
   */
  notify(message) {
    if (true || message.hasNameSome(this.authorNames)) {
      this.notifier.notify(message);
      this.notifySound.play();
    }
  }

  /**
   * 権限を要求する
   */
  async requestPermission() {
    return this.notifier.requestPermission();
  }
}

class MessageProvider {

  /**
   * 引数のメッセージプロバイダからプロバイド可能なものを返す。
   * 注意: タイムアウトは各プロバイダの canProvide の実装に依存する。
   */
  static async selectProvider(providers) {
    return Promise.race(providers.map(async provider =>
      await provider.canProvide() ? provider : undefined
    ));
  }

  constructor() {
    Object.assign(this, {
      listeners: []
    });
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  provideMessage(message) {
    this.listeners.forEach(listener =>
      listener(message)
    );
  }

  async canProvide() {
    throw new Error('NotImplemented');
  }

  start() {
    throw new Error('NotImplemented');
  }

  stop() {
    throw new Error('NotImplemented');
  }

}

class MutationObserverMessageProvider extends MessageProvider {

  start() {
    if (this.observer)
      return;

    const observer = records => {
      records.forEach(record => {
        switch (record.type) {
        case 'childList':
          record.addedNodes && record.addedNodes.forEach(chatItem => {
            const messageOpt = this.parseMessage(chatItem);
            if (messageOpt)
              this.provideMessage(messageOpt);
          });
          break;
        }
      });
    };

    const m = new MutationObserver(observer);
    m.observe(this.observeTarget, { childList: true, subtree: true });

    this.observer = m;
  }

  stop() {
    if (this.observer)
      this.observer.disconnect();
  }

  parseMessage() {
    throw new Error('NotImplemented');
  }

  get observeTarget() {
    throw new Error('NotImplemented');
  }

}

class NormalMessageProvider extends MutationObserverMessageProvider {

  async canProvide() {
    const RETRY    = 30;  // 回
    const INTERVAL = 500; // ミリ秒

    const commentNode = await retry(RETRY, INTERVAL, async () =>
      document.querySelector('[id^="comment-"]')
    );

    return !! commentNode;
  }

  get observeTarget() {
    return document.querySelector('.mrHeader').nextSibling;
  }

  parseMessage(chatItem) {
    const nameElem  = chatItem.querySelector('a[class^="_"][href^="/user/"]');
    const iconElem  = chatItem.querySelector('div[style]');
    const bodyElem  = chatItem.querySelector('span');

    if (nameElem && iconElem) {
      const name    = nameElem.textContent;
      const iconUrl = iconElem.style.backgroundImage.replace(/^url\("/, '').replace(/"\)$/, '');
      const body    = bodyElem.textContent;

      return new Message(name, iconUrl, body);
    }
  }

}

class FullscreenMessageProvider {

  async canProvide() {
    const RETRY    = 30;  // 回
    const INTERVAL = 500; // ミリ秒

    const comment = await retry(RETRY, INTERVAL, async () => undefined 
      // ここ
    );

    return !!comment;
  }

  get observeTarget() {
    return document.querySelector('.mrHeader').nextSibling;
  }

  parseMessage(chatItem) {
    const nameElem  = chatItem.querySelector('div:nth-child(2) > div:nth-child(1)');
    const bodyElem  = chatItem.querySelector('div:nth-child(2) > div:nth-child(2)');
    const iconElem  = chatItem.querySelector('div[style]');
  
    if (nameElem && iconElem) {
      const name    = nameElem.textContent;
      const iconUrl = iconElem.style.backgroundImage.replace(/^url\("/, '').replace(/"\)$/, '');
      const body    = bodyElem.textContent;

      return new Message(name, iconUrl, body);
    }
  }
}

/**
 *
 */
async function main() {
  const channels = new MapSet(
    // にじさんじ 1期生
    '月ノ美兎', '勇気 ちひろ', '🗼える🗼@にじさんじ', '樋口楓【にじさんじ公式】', '静 凛 / Shizuka R',
    '渋谷ハジメ@にじさんじ公式', '鈴谷アキ@にじさんじ所属', 'モイラ@にじさんじ公式',
    // にじさんじ 2期生
    '鈴鹿詩子', '宇志海いちご@にじさんじ所属', '家長むぎ@にじさんじ所属', '夕陽リリ  にじさんじ所属',
    '♥️♠️物述有栖♦️♣️@にじ', '野良猫🐟文野環にじさんじ所属', '伏見ガク にじさんじ所属', 'ギルザレンⅢ世🏰【にじさんじ公',
    '剣持刀也@にじさんじ所属', '森中花咲🐻にじさんじ',
    // COO
    'いわなが', 'にじさんじ',
    // SEEDs
    'ドーラ', '海夜叉神', '名伽尾アズマ', '出雲霞@にじさんじSEEDs', '轟京子🐐にじさんじSEEDs', 'シスター・クレア', '花畑チャイカ',
    '社築', '_安土 桃', '漆黒の捕食者D.E.(鈴木勝)', '緑仙🐼にじさんじSEEDs', '卯月コウ@にじさんじSEEDs', '八朔ゆず🍊にじさんじSEEDs',
    // VOIZ
    '黒羽 黒兎', '神成ポアロ', '成瀬 鳴@VOIZ【ボイズ】', '春崎 エアル 【VOIZ】',
    // ホロライブ
    '夏色まつり@ホロライブ',
  );

  const notifier = [
    new NotifierGM(),
    new NotifierNotificationAPI(),
  ].find(notifier => notifier.supported());

  if (! notifier) {
    window.alert('ブラウザが通知機能に対応していません。この拡張機能を利用できません。');
    return;
  }

  const notificationService = new NotificationService(notifier, notifySound, channels);

  if (! await notificationService.requestPermission()) {
    window.alert('Notificatonの権限がありません');
    return;
  }

  const provider = await MessageProvider.selectProvider([
    new NormalMessageProvider(),
    new FullscreenMessageProvider(),
  ]);

  console.log(provider)

  if (! provider)
    return;

  const chatItemList = document.querySelector('.mrHeader').nextSibling;

  if (! chatItemList)
    return;

  provider.start();
  provider.addListener(message => 
    notificationService.notify(message)
  );
  
  // フルスクリーン切替時に再実行
  const fullscreenButton =
    document.querySelector('.mrHeader + div > div:nth-child(1) > div:nth-child(3) > div:nth-child(2) > div:nth-child(3)');

  if (fullscreenButton)
    fullscreenButton.addEventListener('click', () => {
      provider.stop();
      console.log('normar -> full');
      main();
    });

  const fullscreenButtonWhenFullScreen =
    document.querySelector('.mrHeader + div header > div > div:nth-child(3)');

  if (fullscreenButtonWhenFullScreen)
    fullscreenButtonWhenFullScreen.addEventListener('click', () => {
      provider.stop();
      console.log('full -> normal');
      main();
    });

}

main();
