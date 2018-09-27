import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import Link from '../../components/Link';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2
    },
    fab: {
      position: 'fixed',
      right: 3 * theme.spacing.unit,
      bottom: 3 * theme.spacing.unit,
      zIndex: 1100
    }
  });

interface Props extends WithStyles<typeof styles> {
}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  walletStore: WalletStore;
}

const stylesDecorator = withStyles(styles, { name: 'AddressBook' });

const messages = defineMessages({
  newContactFabTooltip: {
    id: 'wallet-address-book.new-contact-fab-tooltip',
    description: 'Tooltip for new contact floating action button',
    defaultMessage: 'New contact'
  }
});

@inject('walletStore')
@observer
class AddressBook extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  render() {
    const { intl, classes } = this.injected;

    return (
      <div className={classes.content}>
        <Tooltip
          placement="left"
          title={intl.formatMessage(messages.newContactFabTooltip)}
        >
          <Link>
            <Button
              variant="fab"
              className={classes.fab}
              color="secondary"
            >
              <PersonAddIcon />
            </Button>
          </Link>
        </Tooltip>
        <Typography>Hello!</Typography>
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(AddressBook));
