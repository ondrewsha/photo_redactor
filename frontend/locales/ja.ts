
import { TranslationSchema } from '../types';
import { englishStyleNames, defaultSizeLabels } from './styleNames';

export const ja: TranslationSchema = {
  common: {
    generate: "生成",
    cancel: "キャンセル",
    reset: "リセット",
    download: "ダウンロード",
    login: "ログイン",
    register: "新規登録",
    logout: "ログアウト",
    profile: "プロフィール",
    settings: "設定",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    close: "閉じる",
    back: "戻る",
    more: "詳細",
    done: "完了",
    tryAgain: "もう一度試す"
  },
  hero: {
    title: "AIで創造力を解き放つ",
    subtitle: "シンプルな言葉を息を呑むようなビジュアルに。画像生成の未来がここに。誰でも簡単に使えます。",
    cta: "今すぐ作成を開始",
    badge: "Gen-Vエンジン登場",
    learnMore: "詳細を見る"
  },
  features: {
    tag: "プロセス",
    title: "芸術のために設計",
    description: "数秒でコンセプトから傑作へ。クラウドアーキテクチャが複雑な処理を担当し、あなたは創造的な方向に集中できます。",
    step1Title: "記述する",
    step1Desc: "自然な言葉で、想像しているものをAIに正確に伝えます。",
    step2Title: "洗練する",
    step2Desc: "高度なスタイルライブラリとプリセットを使用して、ピクセル単位で微調整します。",
    step3Title: "書き出す",
    step3Desc: "高解像度で作品をダウンロードして、世界と共有しましょう。",
  },
  generator: {
    promptPlaceholder: "ネオンの星雲の中を漂う宇宙服を着た猫...",
    helperText: "見たいものをシンプルな言葉で説明してください。",
    styles: "スタイル",
    size: "サイズ",
    photos: "写真",
    aspectRatio: "アスペクト比",
    quality: "品質",
    popularStyles: "人気",
    openLibrary: "スタイルライブラリ",
    uploadPhoto: "写真をアップロード",
    photoLimit: "最大 {limit} 枚",
    photoInstructions: "生成の参考にする写真をアップロードしてください。",
    photoUnavailable: "現在のエンジンは写真のアップロードに対応していません。",
    initializing: "エンジンを初期化中...",
    readyTitle: "視覚化の準備はできましたか？",
    crafting: "ビジョンを作成中",
    outOfBalance: "生成回数がなくなりました。リチャージしてください。",
    searchStyles: "スタイルを検索...",
    noStylesFound: "スタイルが見つかりません",
    defaultStyle: "スタイルなし",
    styleNames: englishStyleNames,
    sizeLabels: defaultSizeLabels
  },
  history: {
    title: "生成履歴",
    empty: "まだ保存された生成がありません。",
    showMore: "すべて表示",
    modalTitle: "最近の生成",
    modalClose: "閉じる",
    promptLabel: "プロンプト"
  },
  profile: {
    balance: "残高",
    refill: "生成回数を追加",
    verified: "認証済み",
    notVerified: "未認証",
    resendEmail: "認証メールを再送",
    changePassword: "パスワード変更",
    buyGenerations: "パッケージを購入",
    unitPrice: "単価",
    totalPrice: "合計",
    pay: "支払いを完了",
    currency: "JPY",
    units: "個"
  },
  auth: {
    loginTitle: "おかえりなさい",
    registerTitle: "NanoVisualに参加",
    loginSubtitle: "ログインして創作を続けましょう。",
    registerSubtitle: "アカウントを作成して無料の生成回数をゲット。",
    email: "メールアドレス",
    password: "パスワード（8文字以上）",
    noAccount: "アカウントをお持ちでないですか？",
    haveAccount: "すでにアカウントをお持ちですか？",
    or: "または"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "プライバシー",
    terms: "利用規約",
    docs: "ドキュメント",
    support: "サポート"
    ,
    supportTitle: "お困りですか？",
    supportDescription: "ご質問をお送りいただければ、すぐにお答えします。",
    supportEmailLabel: "メール",
    supportEmail: "support@nanovisual.ai",
    supportClose: "閉じる"
  },
  promo: {
    tagline: "今すぐ10,000人以上のクリエイターに参加しよう",
    subtext: "美しいビジュアルがすぐ完成するAIスタジオです。"
  }
};
