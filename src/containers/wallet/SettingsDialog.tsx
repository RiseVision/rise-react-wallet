import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Backdrop from '@material-ui/core/Backdrop';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import Store from '../../stores/store';
import UserStore from '../../stores/user';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center',
      '& p': {
        marginBottom: 0
      }
    },
    footer: {
      '& button': {
        color: 'gray'
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  userStore?: UserStore;
  open: boolean;
  title: string;
  onClose?: () => void;
}

interface State {}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('userStore')
@observer
class SettingsDialog extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const account = props.userStore!.selectedAccount!;
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handleESCKey);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleESCKey);
  }

  handleESCKey = (event: KeyboardEvent) => {
    if (event.keyCode === 27) {
      this.props.onClose();
    }
  }

  handleBackClick = () => {
    this.setState({ open: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    const { open, title, classes } = this.props;

    return (
      <ModalPaper open={open} backdrop={Backdrop}>
        <ModalPaperHeader
          closeButton={true}
          onCloseClick={this.handleBackClick}
        >
          <FormattedMessage id="settings-dialog-title" defaultMessage={title} />
        </ModalPaperHeader>
        <div className={classes.content}>{this.props.children}</div>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(SettingsDialog);
