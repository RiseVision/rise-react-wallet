import { Typography } from '@material-ui/core';
import greenColor from '@material-ui/core/es/colors/green';
import redColor from '@material-ui/core/es/colors/red';
import yellowColor from '@material-ui/core/es/colors/yellow';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { LoadingState } from '../../stores/account';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) =>
  createStyles({
    connectionIcon: {
      width: '1em',
      height: '1em',
      borderRadius: '50%',
      marginRight: '0.5em'
    },
    connected: {
      backgroundColor: greenColor[800]
    },
    disconnected: {
      backgroundColor: redColor[800]
    },
    connecting: {
      backgroundColor: yellowColor[800]
    },
    text: {
      [theme.breakpoints.down('xs')]: {
        display: 'none'
      }
    }
  });

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  walletStore: WalletStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'ConnectionStatus' });

const messages = defineMessages({
  connectedStatus: {
    id: 'wallet-connection.connected-status',
    description: 'Connection status when connected',
    defaultMessage: 'Connected'
  },
  disconnectedStatus: {
    id: 'wallet-connection.disconnected-status',
    description: 'Connection status when disconnected',
    defaultMessage: 'Disconnected'
  },
  connectingStatus: {
    id: 'wallet-connection.connecting-status',
    description: 'Connection status when connecting',
    defaultMessage: 'Connecting'
  }
});

@inject('walletStore')
@observer
class ConnectionStatus extends React.Component<DecoratedProps> {
  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  render() {
    const { intl, classes, walletStore } = this.injected;

    switch (walletStore.connected) {
      case LoadingState.LOADED:
        return (
          <>
            <span
              className={classNames(classes.connected, classes.connectionIcon)}
            />
            <Typography className={classes.text}>
              {intl.formatMessage(messages.connectedStatus)}
            </Typography>
          </>
        );
      case LoadingState.LOADING:
        return (
          <>
            <span
              className={classNames(classes.connecting, classes.connectionIcon)}
            />
            <Typography className={classes.text}>
              {intl.formatMessage(messages.connectingStatus)}
            </Typography>
          </>
        );
      default:
        return (
          <>
            <span
              className={classNames(
                classes.disconnected,
                classes.connectionIcon
              )}
            />
            <Typography className={classes.text}>
              {intl.formatMessage(messages.disconnectedStatus)}
            </Typography>
          </>
        );
    }
  }
}

export default stylesDecorator(injectIntl(ConnectionStatus));
