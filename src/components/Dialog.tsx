import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Backdrop from '@material-ui/core/Backdrop';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ModalPaper from './ModalPaper';
import ModalPaperHeader from './ModalPaperHeader';

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
  open: boolean;
  title: string;
  onClose?: () => void;
}

interface State {}

const stylesDecorator = withStyles(styles);

class Dialog extends React.Component<Props, State> {
  componentDidMount() {
    document.addEventListener('keyup', this.handleESCKey);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handleESCKey);
  }

  handleESCKey = (event: KeyboardEvent) => {
    if (event.keyCode === 27 && this.props.onClose) {
      this.props.onClose();
    }
  }

  handleBackClick = () => {
    this.setState({ open: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

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

export default stylesDecorator(Dialog);