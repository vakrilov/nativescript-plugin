import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { WebView } from 'tns-core-modules/ui/web-view';
import { isAndroid } from "tns-core-modules/platform"
import { Observable, fromObject, EventData } from 'tns-core-modules/data/observable/observable';

const builder = require('tns-core-modules/ui/builder');
const webchatUrl = 'https://webchat.darvin.ai/v1';

export interface NativeChatConfig {
  botId: string;
  channelId: string;
  channelToken: string;
  gtmId?: string;
  sessionContext?: JSON;
  user?: User;
  initConversation?: boolean;
}

export interface User {
  id?: string;
  name?: string;
}

export class NativeChat extends GridLayout {
  private _webView: WebView;
  private _config: NativeChatConfig;

  private webChatConfig: Observable;

  set config(value: NativeChatConfig) {
    if (this._config && this._config.constructor.prototype instanceof Observable) {
      (<any>this._config).off('propertyChange', this.configPropertyChange.bind(this));
    }

    this._config = value;
    this.updateUrl();

    if (this._config && this._config.constructor.prototype instanceof Observable) {
      (<any>this._config).on('propertyChange', this.configPropertyChange.bind(this));
    }
  }

  get config(): NativeChatConfig {
    return this._config;
  }

  constructor() {
    super();
    this.webChatConfig = fromObject({ url: '' });
    this._webView = builder.load(__dirname + '/nativechat.xml') as WebView;
    this._webView.bindingContext = this.webChatConfig;
    this._webView.on('loadFinished', this.webViewLoaded);

    this.addChild(this._webView);
  }

  private webViewLoaded(args) {
    var webview: WebView = <WebView>args.object;
    if (isAndroid) {
      const settings = webview.android.getSettings();
      settings.setDomStorageEnabled(true);
      settings.setDisplayZoomControls(false);
    }
  }

  private configPropertyChange(data: EventData): void {
    this.updateUrl();
  }

  private updateUrl(): void {
    if (this._config && this._config.botId && this._config.channelId && this._config.channelToken) {
      let url = `${webchatUrl}?botId=${encodeURIComponent(this._config.botId)}`;
      url += `&channelId=${encodeURIComponent(this._config.channelId)}`;
      url += `&token=${encodeURIComponent(this._config.channelToken)}`;

      if (this._config.user) {
        if (this.config.user.name) {
          url += `&user=${encodeURIComponent(JSON.stringify({ name: this.config.user.name }))}`;
        }

        if (this.config.user.id) {
          url += `&senderId=${encodeURIComponent(this.config.user.id)}`;
        }
      }

      if (this._config.initConversation) {
        url += `&userMessage=`;
      }

      if (this._config.gtmId != null) {
        url += `&gtmId=${encodeURIComponent(this._config.gtmId)}`;
      }

      if (this._config.sessionContext != null) {
        url += `$context=${encodeURIComponent(JSON.stringify(this._config.sessionContext))}`;
      }
      console.log(url);
      this.webChatConfig.set('url', url);
    } else {
      this.webChatConfig.set('url', '');
    }
  }
}
