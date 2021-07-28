import './styles';
import Component from '@/Core/Component';
import { html } from '@/utils/helper';
import { $router } from '@/Core/Router';
import { svgIcons } from '@/assets/svgIcons';
import { Props, TodayModel } from '@/utils/types';
import DateModel from '@/Model/DateModel';
import { DateState } from '@/utils/types';

export default class Header extends Component<DateState, Props> {
  model!: TodayModel;

  setup() {
    this.model = DateModel;
    this.model.subscribe(this.model.key, this);
    this.$state = {
      today: this.model.today,
    };
  }

  template() {
    const { year, month } = this.$state!.today;

    return html`
      <div class="header-wrapper container">
        <span class="header-title">우아한 가계부</span>
        <div class="switch">
          <div class="switch btn" id="btn-prev-month">${svgIcons.leftBtn}</div>
          <div class="switch-text">
            <div class="switch-text month">${month}월</div>
            <div class="switch-text year">${year}</div>
          </div>
          <div class="switch btn" id="btn-next-month">${svgIcons.rightBtn}</div>
        </div>
        <ul class="menu">
          <li class="menu-list" id="menu-main">${svgIcons.fileText}</li>
          <li class="menu-list" id="menu-calendar">${svgIcons.calendar}</li>
          <li class="menu-list" id="menu-chart">${svgIcons.chart}</li>
        </ul>
      </div>
    `;
  }

  mounted() {
    const $main = this.$target.querySelector('#menu-main') as HTMLElement;
    const $calendar = this.$target.querySelector(
      '#menu-calendar'
    ) as HTMLElement;
    const $chart = this.$target.querySelector('#menu-chart') as HTMLElement;

    $main.addEventListener('click', () => $router.push('/main'));
    $calendar.addEventListener('click', () => $router.push('/calendar'));
    $chart.addEventListener('click', () => $router.push('/charts'));
  }

  handleClickPrevBtn() {
    this.model.getPrevDate();
  }

  handleClickNextBtn() {
    this.model.getNextData();
  }

  setEvent() {
    this.addEvent(
      'click',
      '#btn-prev-month',
      this.handleClickPrevBtn.bind(this)
    );
    this.addEvent(
      'click',
      '#btn-next-month',
      this.handleClickNextBtn.bind(this)
    );
  }

  resetEvent() {
    return false;
  }
}
