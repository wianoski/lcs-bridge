from pykalman import KalmanFilter
import numpy as np
import matplotlib.pyplot as plt
import copy
import pandas as pd

df = pd.read_csv('14122020.csv')
# df = pd.read_csv('dummy.csv')
value = df['us']
outlier_thresh = 0.95

# Treat y as position, and that y-dot is
# an unobserved state - the velocity,
# which is modelled as changing slowly (inertia)

# state vector [y,
#               y_dot]

# transition_matrix =  [[1, dt],
#                       [0, 1]]

observation_matrix = np.asarray([[1, 0]])

# observations:
# t = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
t = df['num']
# print(t)
# print(value)


# dt betweeen observations:
dt = [np.mean(np.diff(t))] + list(np.diff(t))
transition_matrices = np.asarray([[[1, each_dt],[0, 1]]
                                    for each_dt in dt])

# observations
# y = np.transpose(np.asarray([[-123.98,-121.61,-115.2,-120.53,-126.91,-120.72,-117.19,-136.22,-130.3,-123.82,-116.11,-115.11,-120.42,-125.57,-117.95,-129.23,-114.98,-121.22,-123.25,-129.54]]))
y = np.transpose(value)

y = np.ma.array(y)


leave_1_out_cov = []

for i in range(len(y)):
    y_masked = np.ma.array(copy.deepcopy(y))
    y_masked[i] = np.ma.masked

    kf1 = KalmanFilter(transition_matrices = transition_matrices,
                   observation_matrices = observation_matrix)

    kf1 = kf1.em(y_masked)

    leave_1_out_cov.append(kf1.observation_covariance[0,0])

# Find indexes that contributed excessively to observation covariance
outliers = (leave_1_out_cov / np.mean(leave_1_out_cov)) < outlier_thresh

for i in range(len(outliers)):
    if outliers[i]:
        y[i] = np.ma.masked


kf1 = KalmanFilter(transition_matrices = transition_matrices,
                   observation_matrices = observation_matrix)

kf1 = kf1.em(y)

(smoothed_state_means, smoothed_state_covariances) = kf1.smooth(y)


plt.figure()
plt.plot(t, y, 'go-', label="Observations")
plt.plot(t, smoothed_state_means[:,0], 'b--', label="Value Estimate" )
plt.legend(loc="upper left")
plt.xlabel("Time (s)")
plt.ylabel("Value (uS)")

plt.show()