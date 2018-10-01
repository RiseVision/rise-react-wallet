import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import { PropGetters } from 'downshift';
import * as classNames from 'classnames';
import * as React from 'react';
import { TAddressRecord } from '../utils/utils';
import AccountIcon from './AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    root: {
      position: 'absolute',
      zIndex: 1,
      marginTop: theme.spacing.unit,
      top: '100%',
      left: 0,
      right: 0
    },
    menuItemRoot: {
      height: 'initial'
    },
    accountIcon: {
      backgroundColor: 'white'
    },
    accountName: {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },
    selected: {
      fontWeight: 500
    }
  });

interface Props extends WithStyles<typeof styles> {
  suggestions: TAddressRecord[];
  highlightedIndex: number | null;
  selectedItem: TAddressRecord;
  getItemProps: PropGetters<TAddressRecord>['getItemProps'];
}

const stylesDecorator = withStyles(styles, { name: 'AddressSuggestionsMenu' });

class AddressSuggestionsMenu extends React.Component<Props> {
  render() {
    const { classes, suggestions, getItemProps } = this.props;

    return (
      <Paper className={classes.root} square={true}>
        {suggestions.map((item, index) => (
          <MenuItem
            key={`${item.source}-${item.id}`}
            component="div"
            selected={this.isItemHighlighted(index)}
            classes={{
              root: classes.menuItemRoot
            }}
            {...getItemProps({ index, item })}
          >
            <ListItemText
              classes={{
                primary: classNames(
                  classes.accountName,
                  this.isItemSelected(item) && classes.selected
                ),
                secondary: classNames(
                  this.isItemSelected(item) && classes.selected
                )
              }}
              primary={item.name}
              secondary={item.id}
            />
            <ListItemAvatar>
              <Avatar className={classes.accountIcon}>
                <AccountIcon size={24} address={item.id} />
              </Avatar>
            </ListItemAvatar>
          </MenuItem>
        ))}
      </Paper>
    );
  }

  private isItemHighlighted(index: number): boolean {
    const { highlightedIndex } = this.props;
    return index === highlightedIndex;
  }

  private isItemSelected(rec: TAddressRecord): boolean {
    const { selectedItem } = this.props;
    return selectedItem.id === rec.id && selectedItem.source === rec.source;
  }
}

export default stylesDecorator(AddressSuggestionsMenu);
