import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
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
import * as classNames from 'classnames';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AddressBookStore from '../../stores/addressBook';
import { RouteLink } from '../../stores/root';
import CreateContactDialog from './CreateContactDialog';
import {
  addressBookRoute,
  addressBookCreateRoute,
  addressBookModifyRoute,
  addressBookRemoveRoute
} from '../../routes';
import Link from '../../components/Link';
import ModifyContactDialog from './ModifyContactDialog';
import RemoveContactDialog from './RemoveContactDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';

const styles = (theme: Theme) => {
  const normalLayout = theme.breakpoints.up('sm');
  const compactLayout = theme.breakpoints.down('xs');

  return createStyles({
    content: {
      padding: theme.spacing.unit * 2
    },
    fab: {
      position: 'fixed',
      right: 3 * theme.spacing.unit,
      bottom: 3 * theme.spacing.unit,
      zIndex: 1100
    },
    actionButton: {
      width: 28,
      height: 28,
      fontSize: theme.typography.pxToRem(14)
    },
    cell: {
      height: 'unset',
      minHeight: 54,
      padding: `${theme.spacing.unit}px ${2 * theme.spacing.unit}px`,
      '&:last-child': {
        padding: `${theme.spacing.unit}px ${2 * theme.spacing.unit}px`,
      },
      wordBreak: 'break-all',
    },
    compactName: {
      marginTop: 4,
    },
    compactAddress: {
      marginTop: 4,
      marginBottom: 4,
      fontStyle: 'italic',
    },
    actionsCell: {
      textAlign: 'right',
    },
    onlyNormal: {
      [compactLayout]: {
        display: 'none',
      },
    },
    onlyCompact: {
      [normalLayout]: {
        display: 'none',
      },
    },
  });
};

interface Props extends WithStyles<typeof styles> {}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  addressBookStore: AddressBookStore;
}

const stylesDecorator = withStyles(styles, { name: 'AddressBook' });

const messages = defineMessages({
  newContactFabTooltip: {
    id: 'wallet-address-book.new-contact-fab-tooltip',
    description: 'Tooltip for new contact floating action button',
    defaultMessage: 'New contact'
  },
  compactColumnHeader: {
    id: 'wallet-address-book.compact-column-header',
    description: 'Label for the compact column in address book',
    defaultMessage: 'Contact details'
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
  },
  actionModifyTooltip: {
    id: 'wallet-address-book.modify-action-tooltip',
    description: 'Label for the modify contact action button',
    defaultMessage: 'Modify contact'
  },
  actionDeleteTooltip: {
    id: 'wallet-address-book.delete-action-tooltip',
    description: 'Label for the delete contact action button',
    defaultMessage: 'Delete contact'
  },
});

@inject('addressBookStore')
@observer
class AddressBook extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
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
        <RemoveContactDialog navigateBackLink={backLink} />
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
                <TableCell
                  className={classNames(
                    classes.cell,
                    classes.onlyCompact
                  )}
                  children={intl.formatMessage(messages.compactColumnHeader)}
                />
                <TableCell
                  className={classNames(
                    classes.cell,
                    classes.onlyNormal
                  )}
                  children={intl.formatMessage(messages.nameColumnHeader)}
                />
                <TableCell
                  className={classNames(
                    classes.cell,
                    classes.onlyNormal
                  )}
                  children={intl.formatMessage(messages.addressColumnHeader)}
                />
                <TableCell
                  className={classNames(
                    classes.cell,
                    classes.actionsCell
                  )}
                  children={intl.formatMessage(messages.actionsColumnHeader)}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {addressBookStore.asArray.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell
                    className={classNames(
                      classes.cell,
                      classes.onlyCompact
                    )}
                  >
                    <div
                      className={classes.compactName}
                      children={entry.name}
                    />
                    <div
                      className={classes.compactAddress}
                      children={entry.id}
                    />
                  </TableCell>
                  <TableCell
                    className={classNames(
                      classes.cell,
                      classes.onlyNormal
                    )}
                    children={entry.name}
                  />
                  <TableCell
                    className={classNames(
                      classes.cell,
                      classes.onlyNormal
                    )}
                    children={entry.id}
                  />
                  <TableCell
                    className={classNames(
                      classes.cell,
                      classes.actionsCell
                    )}
                  >
                    <Tooltip
                      title={intl.formatMessage(messages.actionModifyTooltip)}
                    >
                      <Link
                        route={addressBookModifyRoute}
                        params={{ id: entry.id }}
                      >
                        <IconButton className={classes.actionButton}>
                          <EditIcon fontSize="inherit" />
                        </IconButton>
                      </Link>
                    </Tooltip>
                    <Tooltip
                      title={intl.formatMessage(messages.actionDeleteTooltip)}
                    >
                      <Link
                        route={addressBookRemoveRoute}
                        params={{ id: entry.id }}
                      >
                        <IconButton className={classes.actionButton}>
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Link>
                    </Tooltip>
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
