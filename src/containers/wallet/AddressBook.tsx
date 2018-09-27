import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
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
  },
  nameColumnHeader: {
    id: 'wallet-address-book.name-column-header',
    description: 'Label for the name column in address book',
    defaultMessage: 'Contact name'
  },
  addressColumnHeader: {
    id: 'wallet-address-book.address-column-header',
    description: 'Label for the address column in address book',
    defaultMessage: 'Address'
  }
});

@inject('walletStore')
@observer
class AddressBook extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  render() {
    const { intl, classes, walletStore } = this.injected;

    // Fake contacts from the current account list
    const contacts = [];
    for (const acc of walletStore.accounts.values()) {
      contacts.push({
        name: acc.name,
        address: acc.id,
      });
    }

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
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  {intl.formatMessage(messages.nameColumnHeader)}
                </TableCell>
                <TableCell>
                  {intl.formatMessage(messages.addressColumnHeader)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((entry) => (
                <TableRow>
                  <TableCell children={entry.name} />
                  <TableCell children={entry.address} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(AddressBook));
