import React, { Component } from 'react';
import './App.scss';
import gsap from 'gsap';
import classNames from 'classnames';

gsap.defaults({
	ease: "none",
	duration: 3,
});

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			index: 1,
			failed: false,
			passed: false,
			stage: 'pregame', // learning, playing, postgame
			status: '',
			count: 6,
			countdown: null, // setTimeout for hiding numbers after some time
			showExperimental: false,
			showOutlines: false,
		};
	}

	componentDidMount = () => {
		// for (let i = 1; i <= this.props.count; i++) {
		// 	this.setItinerary(`#tile-${i}`);
		// }
		this.setState({
			count: this.props.count,
		});
	};

	generateItinerary = () => {
		const $bound = document.getElementById('boundary');
		const $tile = document.getElementById('tile-1');

		const boundX = $bound.offsetWidth;
		const boundY = $bound.offsetHeight;
		const tileX = $tile.offsetWidth;
		const tileY = $tile.offsetHeight;
		const limitX = boundX - tileX;
		const limitY = boundY - tileY;

		const {
			maxDuration,
			minDuration,
		} = this.props;

		const itinerary = [];
		for (let i = 0; i < 10; i++) {
			const cfg = this.generateDestination(limitX, limitY, minDuration, maxDuration);
			itinerary.push(cfg);
		}

		// Starting point
		const start = this.generateDestination(limitX, limitY, minDuration, maxDuration);

		const totalDuration = itinerary.map(cfg => cfg.duration).reduce((a, b) => a + b);

		const output = {
			data: itinerary,
			start,
			totalDuration,
		};
		// console.log('output:', output);

		return output;
	};

	generateDestination = (limitX, limitY, minDuration = 3, maxDuration = 5) => {
		const config = {
			x: Math.round(limitX * Math.random()),
			y: Math.round(limitY * Math.random()),
			duration: gsap.utils.random(minDuration, maxDuration, 1),
		};
		return config;
	};

	setItinerary = () => {
		// For each number, generate animations then add each animations to the timeline
		for (let i = 1; i <= this.state.count; i++) {
			// Selector for the tile we are animating
			const target = `#tile-${i}`;

			// Create a timeline for each tile
			const tl = gsap.timeline({
				autoRemoveChildren: true,
				repeat: 3,
				yoyo: true,
			});

			// Generate a randomized path and starting point for each tile
			const itinerary = this.generateItinerary();
			const { data, start } = itinerary;

			// Move the tile to starting point (to avoid having them start bunched in a corner)
			gsap.set(target, start);
			// // Hide number after some delay
			// gsap.set(target, { color: 'transparent', delay: 2 });

			// Add all animation steps in the itinerary to the timeline
			for (let j = 0; j < data.length; j++) {
				tl.to(target, data[j]);
			}
		}

		this.setState({
			stage: 'learning',
			status: '',
			failed: false,
			passed: false,
			index: 1,
		});

	};


	handleTileClick = event => {
		event.preventDefault();
		const target = event.target;
		const number = parseInt(target.textContent);
		if (this.state.stage !== 'postgame') {


			if (number === this.state.index && number < this.state.count) {
				console.log('Correct');
				this.setState({
					index: this.state.index + 1
				});
			} else if (number === this.state.index && number === this.state.count) {
				console.log('Finished!');
				gsap.globalTimeline.clear();
				this.setState({
					passed: true,
					stage: 'postgame',
					status: 'Passed'
				});
			} else if (number > this.state.index) {
				console.log('Wrong');
				gsap.globalTimeline.clear();
				this.setState({
					failed: true,
					stage: 'postgame',
					status: 'Failed'
				});
			} else {
				// When the tile's number is lower than the current target
				console.log('Repeat?')
			}
		}
	};
	handleStartClick = event => {
		event.preventDefault();

		this.setItinerary();

		// Hide numbers after a few seconds
		const countdown = setTimeout(() => {
			this.setState({ stage: 'playing' });
		}, this.props.learnDuration * 1000);

		this.setState({
			countdown,
		});
	};

	handleCountChange = event => {
		event.preventDefault();
		const { value } = event.target;
		this.reset();
		this.setState({
			count: parseInt(value),
		});
	};

	reset = () => {
		console.log('=== RESET GAME ==>');

		if (this.state.countdown !== null) {
			clearTimeout(this.state.countdown);
		}

		// Clear state values
		this.setState({
			stage: 'pregame',
			status: '',
			failed: false,
			passed: false,
			index: 1,
			countdown: null,
		});

		// Remove all animation timelines by setting the progress to the end of the timelines.
		// | Note: Tried using other gsap functions specifically for killing timelines/tweens, 
		// | but they didn't work for me. This workaround seems to do the job.
		// gsap.globalTimeline.progress(1);
		gsap.globalTimeline.clear();

		console.debug('globalTL children:', gsap.globalTimeline.getChildren());
	};

	render = () => {

		return (
			<div id="app" className={classNames("app", {
				'is-playing': this.state.stage === 'playing',
				'is-learning': this.state.stage === 'learning',
				'show-outlines': this.state.showOutlines === true,
			})}>
				<main className="container">

					<div id="boundary" className="boundary">
						{Array(this.state.count).fill('😎').map((x, i) => {
							const num = i + 1;
							// Stack tiles so the lowest number is on top. The formula below will result 
							// in the last number having a z-index of 1. If this z-index range is problematic, 
							// just shift the range by adding an arbitrary number to the formula
							const zIndex = this.state.count - i;
							return (
								<div
									id={`tile-${num}`}
									onClick={this.handleTileClick}
									key={num}
									className={classNames("tile", {
										correct: num < this.state.index || this.state.passed === true,
									})}
									style={{ zIndex, }}
								>
									{num}
								</div>
							);
						})}

						{/* Overlays =============================================================*/}
						<div className={classNames("overlay", {
							hidden: this.state.stage !== 'pregame' && this.state.stage !== 'postgame'
						})}>
							<div className="marquee">
								<i className="fas fa-user-secret"></i>
								{/* Show result if post-game */}
								{(this.state.stage === 'postgame' && this.state.status !== '') && (
									// <React.Fragment>
									<h2>{this.state.passed === true ? `Security Clearance Accepted` : `Failed Security Clearance`}</h2>
									// </React.Fragment>
								)}

								{/* Show VR Icon if pre-game */}
								{this.state.stage === 'pregame' && (
									<React.Fragment>
										{/* <i className="fas fa-user-secret"></i> */}
										<h2>Finger Print Not Recognized</h2>
										<p>Proof of Training Required</p>
									</React.Fragment>
								)}
							</div>

							<button
								type='button'
								id='start'
								className='btn start-btn'
								onClick={this.handleStartClick}
							>
								Play VAR
							</button>
						</div>


					</div>


					{/* Toolbar for Options and Controls ========================================*/}
					<aside id='controls' className='toolbar'>
						<div className="control-group left-group">
							<button
								className="btn btn-blank"
								id="toggle-exp"
								onClick={this.toggleExperimental}
								title='Experimental features that could be unstable'
							>
								<i className="fas fa-flask"></i>
							</button>

							<div className={classNames("control-group test-group", { hidden: !this.state.showExperimental })}>
							
								<button 
									id="outlines" 
									className="btn btn-blank" 
									onClick={this.toggleOutlines}
									title="Show outlines"
								>
									<i className="fas fa-vector-square"></i>
								</button>

								<div className={classNames("control-group playback-group")}>
									<button 
										id="resume" 
										className='btn btn-blank' 
										onClick={this.handleResume}
										title="Resume movement"
									> 
										<i className="fas fa-play"></i> 
									</button>
									
									<button 
										id="pause" 
										className='btn btn-blank' 
										onClick={this.handlePause}
										title="Pause movement"
									> 
										<i className="fas fa-pause"></i> 
									</button>
								</div>
							</div>
						</div>

						<div className="control-group count-group">
							<label htmlFor="count">Number of Tiles</label>
							<input
								type="number"
								name="count"
								id="count"
								value={this.state.count}
								onChange={this.handleCountChange}
							/>
						</div>
					</aside>

				</main>
			</div>
		);
	};


	toggleOutlines = event => {
		event.preventDefault();
		this.setState({
			showOutlines: !this.state.showOutlines,
		});
	};
	toggleExperimental = event => {
		event.preventDefault();
		this.setState({
			showExperimental: !this.state.showExperimental,
		});
	};
	handlePause = event => {
		event.preventDefault();
		gsap.globalTimeline.pause();
	};
	handleResume = event => {
		event.preventDefault();
		gsap.globalTimeline.resume();
	};
}

export default App;

App.defaultProps = {
	count: 6,
	maxDuration: 4,
	minDuration: 2,
	learnDuration: 3,
};
