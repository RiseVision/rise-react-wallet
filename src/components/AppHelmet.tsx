import React from 'react';
import { Helmet } from 'react-helmet';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

interface Props {
  locale: string;
}

type DecoratedProps = Props & InjectedIntlProps;

const messages = defineMessages({
  appTitle: {
    id: 'app-helmet.title',
    description: 'Browser tab title',
    defaultMessage: 'RISE wallet'
  }
});

class AppHelmet extends React.Component<DecoratedProps> {
  render() {
    const { intl, locale } = this.props;

    return (
      <Helmet
        htmlAttributes={{
          lang: locale
        }}
        defaultTitle={intl.formatMessage(messages.appTitle)}
      />
    );
  }
}

export default injectIntl(AppHelmet);
