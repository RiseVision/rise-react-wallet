import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Snackbar from '@material-ui/core/es/Snackbar';
import Button from '@material-ui/core/es/Button';
import IconButton from '@material-ui/core/es/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import RootStore from '../stores/root';

const styles = (theme: Theme) =>
  createStyles({
    snackbar: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    close: {
      padding: theme.spacing.unit / 2
    }
  });

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  store: RootStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'UpdateAvailableSnackbar' });

const messages = defineMessages({
  message: {
    id: 'update-available.message',
    description: 'New version notification',
    defaultMessage:
      'A new version of the wallet is available. Reload to update.'
  },
  reloadLabel: {
    id: 'update-available.reload-label',
    description: 'Reload button label',
    defaultMessage: 'Reload'
  },
  dismissAriaLabel: {
    id: 'update-available.dismiss-aria-label',
    description: 'Dismiss new version notification aria label',
    defaultMessage: 'Dismiss'
  }
});

@inject('store')
@observer
class UpdateAvailableSnackbar extends React.Component<DecoratedProps> {
  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  handleReloadClick = () => {
    location.reload();
  }

  @action
  handleDismissClick = () => {
    const { store } = this.injected;
    store.updateAvailable = false;
  }

  render() {
    const { intl, store, classes } = this.injected;

    return (
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={store.updateAvailable}
        ContentProps={{
          className: classes.snackbar,
          'aria-describedby': 'update-available-msg'
        }}
        message={
          <span id="update-available-msg">
            {intl.formatMessage(messages.message)}
          </span>
        }
        action={[
          <Button
            key="reload"
            color="secondary"
            size="small"
            onClick={this.handleReloadClick}
            children={intl.formatMessage(messages.reloadLabel)}
          />,
          <IconButton
            key="dismiss"
            className={classes.close}
            aria-label={intl.formatMessage(messages.dismissAriaLabel)}
            color="inherit"
            onClick={this.handleDismissClick}
            children={<CloseIcon />}
          />
        ]}
      />
    );
  }
}

export default stylesDecorator(injectIntl(UpdateAvailableSnackbar));
