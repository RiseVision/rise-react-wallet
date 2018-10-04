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
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AddressBookStore from '../../stores/addressBook';
import { RouteLink } from '../../stores/root';
import CreateContactDialog from './CreateContactDialog';
import {
  addressBookRoute,
  addressBookCreateRoute,
  addressBookModifyRoute
} from '../../routes';
import Link from '../../components/Link';
import ModifyContactDialog from './ModifyContactDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';

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

interface Props extends WithStyles<typeof styles> {}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  addressBookStore: AddressBookStore;
  routerStore: RouterStore;
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
  },
  actionsColumnHeader: {
    id: 'wallet-address-book.actions-column-header',
    description: 'Label for the actions column in address book',
    defaultMessage: 'Actions'
  }
});

@inject('addressBookStore')
@inject('routerStore')
@observer
class AddressBook extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleEditContact = (id: string) => () => {
    this.injected.routerStore.goTo(addressBookModifyRoute, { id });
  }

  handleDeleteContact = (id: string) => () => {
    const { addressBookStore } = this.injected;
    const name = addressBookStore.contacts.get(id) || '';
    // TODO material dialog
    if (window.confirm(`Delete ${name}?`)) {
      addressBookStore.contacts.delete(id);
    }
  }

  render() {
    const { intl, classes, addressBookStore } = this.injected;

    const backLink: RouteLink = {
      route: addressBookRoute
    };

    return (
      <div className={classes.content}>
        <CreateContactDialog navigateBackLink={backLink} />
        <ModifyContactDialog navigateBackLink={backLink} />
        <Tooltip
          placement="left"
          title={intl.formatMessage(messages.newContactFabTooltip)}
        >
          <Link route={addressBookCreateRoute}>
            <Button variant="fab" className={classes.fab} color="secondary">
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
                <TableCell>
                  {intl.formatMessage(messages.actionsColumnHeader)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addressBookStore.asArray.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell children={entry.id} />
                  <TableCell>
                    {/* TODO broken edit icon */}
                    <Link
                      route={addressBookModifyRoute}
                      params={{ id: entry.id }}
                    >
                      <EditIcon onClick={this.handleEditContact(entry.id)} />
                    </Link>
                    <DeleteIcon onClick={this.handleDeleteContact(entry.id)} />
                  </TableCell>
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
