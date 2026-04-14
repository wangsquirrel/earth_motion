export type AppLanguage = 'zh-CN' | 'en';

const MONTH_LABELS_BY_LANGUAGE: Record<AppLanguage, string[]> = {
  'zh-CN': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const DIRECTION_LABELS_BY_LANGUAGE: Record<AppLanguage, [string, string, string, string]> = {
  'zh-CN': ['北', '东', '南', '西'],
  en: ['N', 'E', 'S', 'W'],
};

const BODY_LABELS_BY_LANGUAGE: Record<AppLanguage, Record<string, string>> = {
  'zh-CN': {
    Sun: '太阳',
    Moon: '月亮',
    Mercury: '水星',
    Venus: '金星',
    Mars: '火星',
    Jupiter: '木星',
    Saturn: '土星',
    Uranus: '天王星',
    Neptune: '海王星',
    Pluto: '冥王星',
  },
  en: {
    Sun: 'Sun',
    Moon: 'Moon',
    Mercury: 'Mercury',
    Venus: 'Venus',
    Mars: 'Mars',
    Jupiter: 'Jupiter',
    Saturn: 'Saturn',
    Uranus: 'Uranus',
    Neptune: 'Neptune',
    Pluto: 'Pluto',
  },
};

export function getMonthLabels(language: AppLanguage) {
  return MONTH_LABELS_BY_LANGUAGE[language];
}

export function getDirectionLabels(language: AppLanguage) {
  return DIRECTION_LABELS_BY_LANGUAGE[language];
}

export function getLocalizedBodyLabel(name: string, language: AppLanguage) {
  return BODY_LABELS_BY_LANGUAGE[language][name] ?? name;
}

export function getLanguageCopy(language: AppLanguage) {
  return language === 'zh-CN'
    ? {
      app: {
        frameObserver: '地平参考系',
        frameCelestial: '天球参考系',
        earthView: '地面视角',
        spaceDescriptionObserver: '在本地地平参考系中观察太阳的位置变化。',
        spaceDescriptionCelestial: '在天球参考系中观察太阳相对天球的位置变化。',
        earthDescription: '从地球特定纬度观察太阳的周日与周年视运动。',
        logoAlt: '地球运动标志',
        title: '地球运动 - Earth Motion',
        footerBrand: '地球运动',
      },
      panel: {
        display: '显示',
        view: '视图',
        frame: '参考系',
        skyCulture: '星空体系',
        language: '界面语言',
        layers: '图层',
        timeControls: '时间控制',
        timeUtc: '时间（UTC）',
        lunar: '农历',
        latitude: '纬度',
        utcBadge: 'UTC',
        mobileControls: '控制面板',
        mobileMinimize: '收起',
        mobileControlsExpand: '展开控制面板',
        mobileControlsCollapse: '收起控制面板',
      },
      controls: {
        earth: '地面',
        space: '太空',
        observer: '地平',
        celestial: '天球',
        chinese: '中国星官',
        western: '西方星座',
        languageZh: '中文',
        languageEn: 'English',
        horizonOverlay: '地平叠加',
        diurnalArc: '周日轨迹',
        milkyWay: '银河',
        stars: '恒星',
        moon: '月亮',
        planets: '行星',
        ecliptic: '黄道',
      },
      scene: {
        zenith: '天顶',
        celestialEquator: '天赤道',
      },
      speed: {
        1: '1x',
        3600: '1时/秒',
        86400: '1天/秒',
        604800: '1周/秒',
      } as Record<number, string>,
      latitudeDirection: {
        north: '北纬',
        south: '南纬',
      },
    }
    : {
      app: {
        frameObserver: 'Horizon Frame',
        frameCelestial: 'Celestial Frame',
        earthView: 'Earth View',
        spaceDescriptionObserver: 'Observing the Sun in the local horizon frame.',
        spaceDescriptionCelestial: 'Observing the Sun against the celestial sphere in the celestial frame.',
        earthDescription: 'Observing the Sun’s apparent daily and annual motion from a specific latitude on Earth.',
        logoAlt: '地球运动标志',
        title: '地球运动 - Earth Motion',
        footerBrand: '地球运动',
      },
      panel: {
        display: 'Display',
        view: 'View',
        frame: 'Frame',
        skyCulture: 'Sky Culture',
        language: 'Language',
        layers: 'Layers',
        timeControls: 'Time Controls',
        timeUtc: 'Time (UTC)',
        lunar: 'Lunar',
        latitude: 'Latitude',
        utcBadge: 'UTC',
        mobileControls: 'Controls',
        mobileMinimize: 'Minimize',
        mobileControlsExpand: 'Expand controls',
        mobileControlsCollapse: 'Collapse controls',
      },
      controls: {
        earth: 'Earth',
        space: 'Space',
        observer: 'Horizon',
        celestial: 'Celestial',
        chinese: 'Chinese',
        western: 'Western',
        languageZh: '中文',
        languageEn: 'English',
        horizonOverlay: 'Horizon Overlay',
        diurnalArc: 'Diurnal Arc',
        milkyWay: 'Milky Way',
        stars: 'Stars',
        moon: 'Moon',
        planets: 'Planets',
        ecliptic: 'Ecliptic',
      },
      scene: {
        zenith: 'Zenith',
        celestialEquator: 'Celestial Equator',
      },
      speed: {
        1: '1x',
        3600: '1Hr/s',
        86400: '1Day/s',
        604800: '1Wk/s',
      } as Record<number, string>,
      latitudeDirection: {
        north: 'N',
        south: 'S',
      },
    };
}
