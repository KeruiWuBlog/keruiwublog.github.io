---
title: Efficient Collaborative Learning under Smoothness Assumption
date: 2026-06-04
lang: en
translation_key: collaborative_smoothness
categories:
  - Theory
tags:
  - Collaborative Learning
  - PAC Learning
  - Learning Theory
---
::: paper V1984
title: A Theory of the Learnable
authors: Leslie G. Valiant
venue: Communications of the ACM
year: 1984
doi: 10.1145/1968.1972
:::

::: paper BEHW1989 
title: Learnability and the Vapnik-Chervonenkis Dimension
authors: Anselm Blumer and Andrzej Ehrenfeucht and David Haussler and Manfred K. Warmuth
venue: Journal of the ACM
year: 1989
doi: 10.1145/76359.76371
:::

::: paper BHPQ2017
title: Collaborative PAC Learning
authors: Avrim Blum and Nika Haghtalab and Ariel D. Procaccia and Mingda Qiao
venue: Advances in Neural Information Processing Systems
year: 2017
doi: 10.5555/3294996.3295000
:::

::: paper DQ2024
title: Collaborative Learning with Different Labeling Functions
authors: Yuyang Deng and Mingda Qiao
venue: Proceedings of the 41st International Conference on Machine Learning
year: 2024
doi: 10.5555/3692070.3692488
:::

::: paper CSZ2006
title: Semi-Supervised Learning
authors: Olivier Chapelle and Bernhard Schölkopf and Alexander Zien
venue: MIT Press
year: 2006
doi: 10.5555/1208768
:::

::: paper R2007
title: Generalization Error Bounds in Semi-Supervised Classification Under the Cluster Assumption
authors: Philippe Rigollet
venue: Journal of Machine Learning Research
year: 2007
doi: 10.5555/1314498.1314545
:::

::: paper BNS2006
title: Manifold Regularization: A Geometric Framework for Learning from Labeled and Unlabeled Examples
authors: Mikhail Belkin and Partha Niyogi and Vikas Sindhwani
venue: Journal of Machine Learning Research
year: 2006
doi: 10.5555/1248547.1248632
:::

::: paper BDBC2010
title: A Theory of Learning from Different Domains
authors: Shai Ben-David and John Blitzer and Koby Crammer and Alex Kulesza and Fernando Pereira and Jennifer Wortman Vaughan
venue: Machine Learning
year: 2010
doi: 10.1007/s10994-009-5152-4
:::

::: paper S1982
title: Optimal Global Rates of Convergence for Nonparametric Regression
authors: Charles J. Stone
venue: The Annals of Statistics
year: 1982
doi: 10.1214/aos/1176345969
:::

::: paper AB2009
title: Neural network learning: Theoretical foundations
authors: Anthony and Martin and Bartlett and Peter L
venue: cambridge university press
year: 2009
doi: 10.1017/CBO9780511624216
:::



# Introduction
PAC learning \citep{V1984,BEHW1989} provides a foundational theoretical framework for studying when a hypothesis class can be learned from finitely many labeled samples with provable accuracy and confidence guarantees. In the classical setting, a learner observes labeled samples from a single distribution and uses the empirical error on those samples as a proxy for the true population error. The central question is <u>whether a predictor that performs well empirically will also generalize to unseen data, and how many labeled samples are required to guarantee this with high probability</u>.

Collaborative PAC learning \citep{BHPQ2017} extends this viewpoint to a <u>multi-distribution</u> setting, where different players may have different data distributions but the learning goal is collective: using samples across the players, the algorithm should return accurate predictors for all players while keeping the total labeled sample complexity small. 

Recent work of \citet{DQ2024} further studies collaborative PAC learning with heterogeneous labeling functions. Specifically, instead of governed by one shared target function, different players may follow different labeling rules, and the collection of players is assumed to be partitionable into a small number of latent learning tasks. However, \citet{DQ2024} show that such heterogeneity alone does not guarantee efficient collaborative learning: without additional assumptions, finding an optimal partition of players into latent tasks is <u>NP-hard</u>, making the corresponding learning problem computationally intractable in general. This motivates the search for natural structural assumptions under which efficient collaborative PAC learning with low labeled sample complexity becomes possible.

This study focuses on a classical and intuitive answer: <u>smoothness assumption</u>. Roughly speaking, if two players belong to the same latent task, then their marginal distributions should not be arbitrarily far apart. If a model trained on one player works well there, and the other player sees a similar enough distribution, then the same model should also work reasonably well for the second player. This type of assumption is common across machine learning. For example, in semi-supervised learning, smoothness, cluster, and manifold assumptions are often used to connect the geometry of the marginal distribution with the behavior of the labeling function: nearby points, points in the same high-density region, or points lying on the same low-dimensional manifold are expected to have similar labels \citep{CSZ2006,R2007,BNS2006}. Similarly, in nonparametric regression, classical Lipschitz smoothness assumptions formalize the idea that small changes in the input should not cause large changes in the target function \citep{S1982}. We formalize an analogous intuition for collaborative PAC learning using tools from domain adaptation theory, especially the $H\Delta H$-divergence between marginal distributions \citep{BDBC2010}.

# Problem Setup
We adopt the following standard model of binary classification: The hypothesis class $\mathcal{F}\subseteq \{ 0, 1 \}^{\mathcal{X}}$ is a family of binary functions over the instance space ($\mathcal{X}$) with a VC dimension of $d$. A data distribution $\mathcal{D}$ is a distribution over $\mathcal{X} \times \{ 0, 1\}$. The population error of a function $f: \mathcal{X} \to \{ 0, 1 \}$ on data distribution $\mathcal{D}$ is defined as 
$$
\varepsilon(f)\coloneqq \Pr_{(x,y)\sim D_i}[f(x)\neq y].
$$
Similarly, the training (empirical) error of $f$, given a dataset with finite samples, i.e., $S = \{(x_i, y_i)\}_{i \in [m]}$, is defined as 
$$
\hat{\varepsilon}(f) \coloneqq \frac{1}{m} \sum_{i=1}^m \mathbf{1} \{ f(x_i) \neq y_i \}.
$$ 

## Collaborative Learning
The learning algorithm is given sample access to $n$ data distributions $\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n$. At each step, the algorithm is allowed to choose one of the $n$ distributions and draw an example from it. The goal of the learning algorithm is to output one hypothesis $\hat{f}_i$ for each task $i \in [n]$ such that 
$$
\Pr \left[ \varepsilon_i(\hat f_i)\le \epsilon,  \forall i \in [n] \right] \geq 1 - \delta,
$$
while using as few labeled examples as possible. This is also known as $(\epsilon, \delta)$-PAC. 

### Existing Results
In classic (non-collaborative) PAC learning, it is well-known that sampling a set $S$ of size
$$
\mathcal{O} \left( \frac{1}{\epsilon} \left( d \ln \frac{1}{\epsilon} + \ln \frac{1}{\delta}\right) \right) = \tilde{\mathcal{O}}(d),
$$
is sufficient to learn a hypothesis given a hypothesis class $\mathcal{F}$ of VC dimension $d$ that satisfies $(\epsilon, \delta)$-PAC \citep{AB2009}. 

In collaborative setting, it is easy to see that naively training $n$ distributions independently gives a sample complexity of 
$$
\tilde{\mathcal{O}}(nd).
$$
\citet{BHPQ2017} introduced a sample-efficient algorithm when all distributions admit the same labeling function under the realizable assumption. Specifically, \citet{BHPQ2017} achieves a sample complexity of 
$$
\mathcal{O} \left( \frac{\ln n}{\epsilon} \left( (d+n) \ln \frac{1}{\epsilon} + n \ln \frac{n}{\delta} \right) \right) = \tilde{\mathcal{O}}(d + n).
$$

When it comes to heterogeneous labeling functions, beyond the standard realizability assumption, \citet{DQ2024} defines $(k, \epsilon)$-realizability as shown below:

\begin{definition}[$(k, \epsilon)$-realizability]
\label{def:k_eps_realizability}
Distributions $\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n$ are $(k, \epsilon)$-realizable with respect to hypothesis class $\mathcal{F}$, if there exist $f_1^\star, \dots, f_k^\star \in \mathcal{F}$ and $\sigma^\star:[n]\to[k]$ such that $\varepsilon_i(f^\star_{\sigma^\star(i)})=0$ for every $i\in[n]$. 
\end{definition}

\Cref{def:k_eps_realizability} guarantees that we can find $k$ classifiers in $\mathcal{F}$, such that on each of the distributions, at least one of the classifiers achieves a population error below $\epsilon$. Under such an assumption, \citet{DQ2024} gives a learning algorithm that achieve $(8\epsilon, \delta)$-PAC with a sample complexity of 
$$
\mathcal{O} \left( \frac{k d \log(n/k)\log(1/\epsilon)}{\epsilon} + \frac{n\log k \log(1/\epsilon) + n\log(n/\delta)}{\epsilon} \right) = \tilde{\mathcal{O}} (kd + n).
$$
However, \citet{DQ2024} further shows that the learning algorithm might not be computationally efficient, even if there is a computationally efficient learner for $\mathcal{F}$ in the usual PAC learning setup. To side-step this, \citet{DQ2024} considers a special case where all $n$ distributions share the same marginal over $\mathcal{X}$ and propose an efficient algorithm with a sample complexity of 
$$
\mathcal{O} \left( \frac{kd \log(1 / \epsilon)}{\epsilon} + \frac{n \log (n / \delta)}{\epsilon} \right) = \tilde{\mathcal{O}} (kd + n).
$$
In this study, we carefully argue that such a special case can be overly pessimistic and the proposed algorithm framework can be generalized to a weaker smoothness assumption: only distributions that share the same $\mathcal{Y}$ space have a similar marginals; while other distributions can have (significantly) different marginal distributions.

## Smoothness Assumption
The key structural assumption we use is an intra-task smoothness assumption over the marginal distributions. Intuitively, if two players belong to the same latent learning task, then their inputs should not come from completely unrelated regions of the instance space. Following \citet{BDBC2010}, we use $\mathcal{H}$-divergence to measure the discrepancy between marginal distributions by asking whether a classifier from a given hypothesis class can distinguish examples drawn from the two domains.

\begin{definition}[$\mathcal{H}$-divergence]
\label{define:H_Delta_H}
For two distributions $P, Q$ over $\mathcal{X}$, let $\mathcal{H}$ be a hypothesis class and denote by $I(h)$ the set for which $h \in \mathcal{H}$ is the characteristic function, i.e., $x \in I(h) \iff h(x) = 1$, then
\[
d_{\mathcal{H}} (P, Q) = 2 \sup_{h \in \mathcal{H}} \left| \Pr_P (I(h)) - \Pr_{Q} [I(h)] \right|.
\]
\end{definition}

\citet{BDBC2010} further propose some useful tools to empirically estimate such a $\mathcal{H}$-divergence with only the use of <u>unlabeled data</u>, which makes the smoothness assumption to be easily verified at a low cost. 

\begin{lemma}
\label{lemma:empirical_h_divergence}
For a symmetric hypothesis class $\mathcal{H}$ (one where for every $h \in \mathcal{H}$, the inverse hypothesis $1-h$ is also in $\mathcal{H}$) and samples $\mathcal{U}_P,\mathcal{U}_Q$ of size $m$, 
$$
\hat{d}_{\mathcal{H}}(P, Q) = 2\left(1-\min_{h \in \mathcal{H}}\left[\frac{1}{m}\sum_{\mathbf{x}:h(\mathbf{x})=0} I[\mathbf{x}\in \mathcal{U}_P] + \frac{1}{m}\sum_{\mathbf{x}:h(\mathbf{x})=1} I[\mathbf{x}\in \mathcal{U}_Q]\right]\right),
$$ 
where $I[\mathbf{x}\in\mathcal{U}]$ is the binary indicator variable which is $1$ when $\mathbf{x}\in\mathcal{U}$. 
\end{lemma}
\begin{lemma}
\label{lemma:h_divergence_inequality}
Let $\mathcal{H}$ be a hypothesis space on $\mathcal{X}$ with VC dimension $d$. If 
$$
\mathcal{U}_P = \{ x_1, \dots, x_m \} \sim Q^m; \mathcal{U}_Q = \{ x'_1, \dots, x'_m \} \sim Q^m
$$  
are unlabeled samples of size $m$ from $P$ and $Q$ respectively and $\hat{d}_{\mathcal{H}}(P, Q)$ is the empirical $\mathcal{H}$-divergence between samples, then for any $\delta \in (0,1)$, with probability at least $1-\delta$,
$$
d_{\mathcal{H}}(P,Q) \le \hat{d}_{\mathcal{H}}(P,Q) + 4\sqrt{ \frac{ d\log(2m)+\log\left(\frac{2}{\delta}\right) }{m}}.
$$
\end{lemma}
In short, \Cref{lemma:empirical_h_divergence} shows that estimating $\mathcal{H}$-divergence can be reduced to a binary domain-classification problem: if no classifier in $\mathcal{H}$ can reliably distinguish whether an unlabeled example comes from $P$ or $Q$, then the two marginal distributions are close with respect to $\mathcal{H}$. \Cref{lemma:h_divergence_inequality} further implies that the empirical $\mathcal{H}$-divergence can be directly used to estimate the real $\mathcal{H}$-divergence with a sufficiently large $m$. 

One more key definition we use in this study, also adapted from \citet{BDBC2010}, is the symmetric difference hypothesis space, $\mathcal{H} \Delta \mathcal{H}$, for a hypothesis space $\mathcal{H}$. 

\begin{definition}[$\mathcal{H} \Delta \mathcal{H}$]
\label{def:h_delta_h}
For a hypothesis space $\mathcal{H}$, the symmetric difference hypothesis space $\mathcal{H}\Delta \mathcal{H}$ is the set of hypotheses
$$
g \in \mathcal{H} \Delta \mathcal{H}
\;\Longleftrightarrow\;
g(\mathbf{x}) = h(\mathbf{x}) \oplus h'(\mathbf{x})
\quad \text{for some } h,h' \in \mathcal{H},
$$
where $\oplus$ is the XOR function. 
\end{definition}

# Efficient Collaborative Learning Algorithm
Now we are ready to present the formal assumption, as well as the efficient algorithm that achieves collaborative $(\epsilon, \delta)$-PAC with low sample complexity. 

\begin{assumption}
\label{asm:main_asm}
The instance $(\mathcal{F},\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n)$ satisfies the following.
  - **$(k,0)$-realizable.**

  - **Smoothness Assumption.** For every pair $i, j$ with $\sigma^\star(i)=\sigma^\star(j)$: $\mathcal{H} \Delta \mathcal{H} (\mathcal{D}_i,\mathcal{D}_j) \leq \tau$.

  We assume throughout that $\tau \leq c_{\tau} \epsilon$ for a sufficiently small absolute constant $c_{\tau}$.
\end{assumption}
\begin{remark}
While we assume a $(k, 0)$-realizability in \Cref{asm:main_asm}, we argue that it is easy to extend this to $(k, \epsilon)$-realizability, which will loosen the collaborative PAC bound of \Cref{thm:main} to $(c \cdot \epsilon, \delta)$-PAC, where the constant factor will be absorbed by the big-O notation.
\end{remark}

Based on \Cref{asm:main_asm}, we propose a simple algorithm, namely, Greedy Merging, as shown in \Cref{alg:main}. Generally speaking, the algorithm maintains a representative list $R = \{ (\hat{h}_a, a): a \in [\hat{k}] \}$. For each new player, the algorithm draws one fresh validation sample to check if there is a fitting representative. If none pass, the player opens a new representative by drawing a larger founder sample and fitting a new representative hypothesis. Under \Cref{asm:main_asm}, we argue that Greedy Merging gives a polynomial runtime and will form at most $\hat{k} \leq k$ clusters, which, in turn, leads to a low sample complexity. 

\begin{algorithm}
\caption{Greedy Merging}
\label{alg:main}
\begin{algorithmic}[1]
\State $m_f \gets c_1 \cdot \frac{d + \log (2n / \delta)}{\epsilon}$
\State $m_v \gets c_2 \cdot \frac{\log(n^2 / \delta)}{\epsilon}$
\State Initialize $\hat{\sigma}: [n] \rightarrow \mathbb{N}$
\State $R \gets \emptyset$
\For{each player $i = 1, 2, \dots, n$}
    \State $S_i \sim D_i^{m_v}$
    \For{each $(\hat{h}_a, a) \in R$}
        \If{$\operatorname{err}_{S_i}(\hat{h}_a) \leq \frac{1}{2} \epsilon$}
            \State $\hat{\sigma} (i) \gets a$
        \Else
            \State $a_{\mathrm{new}} \gets \mathrm{fresh\;index}$
            \State $\hat{\sigma} (i) \gets a_{\mathrm{new}}$
            \State $Q_i \sim D_i^{m_f}$
            \State $\hat{h}_{a_{\mathrm{new}}} \gets \mathrm{ERM}_{\mathcal F} (Q_i)$
            \State add $\left( \hat{h}_{a_{\mathrm{new}}}, a_{\mathrm{new}} \right)$ to $R$
        \EndIf
    \EndFor
\EndFor
\end{algorithmic}
\end{algorithm}

\begin{theorem}
\label{thm:main}
Fix $\epsilon,\delta \in (0,1)$. Under \Cref{asm:main_asm}, \Cref{alg:main}, with sufficiently large $c_1$ and $c_2$, satisfies $\Pr \left[ \varepsilon_i(\hat f_i)\le \epsilon,  \forall i \in [n] \right] \geq 1 - \delta$ with a sample complexity of 
$$
\mathcal{O} \left( \frac{k(d + \log (n / \delta) + n \log (n^2 / \delta))}{\epsilon} \right) = \tilde{\mathcal{O}} \left( kd + n \right).
$$
\end{theorem}

The proof of \Cref{thm:main} is based on the standard Chernoff bound (formally stated in \Cref{lemma:chernoff}) and a domain adaptation inequality proposed by \citet{BDBC2010} (formally stated in \Cref{lemma:doamin_adapt_decompose}). 

\begin{lemma}[Chernoff Bound]
\label{lemma:chernoff}
Let $X_1,\ldots,X_n$ be independent random variables with $X_i \in \{0,1\}$ and $\Pr[X_i=1]=p$, for $i=1,\ldots,n$. Set $X := \sum_{i=1}^n X_i$. Then, for any $t \in [0,1-p]$, we have
$$
\Pr[X \ge (p+t)n] \leq \exp({-D_{\mathrm{KL}}(p+t \| p)n}).
$$
\end{lemma}
\begin{lemma}
\label{lemma:doamin_adapt_decompose}
For any $\delta \in (0, 1)$, with probability at least $1 - \delta$ (over the choice of the sample), for every $h \in \mathcal{H}$:
$$
\varepsilon_j (h) \leq \varepsilon_i (h) + \frac{1}{2} \mathcal{H} \Delta \mathcal{H} (P_i, P_j) + \lambda_{ij},
$$
where $\lambda_{ij} = \min_{h' \in \mathcal{H}} \left[ \varepsilon_i (h') + \varepsilon_j (h') \right]$. 
\end{lemma}

Now we are ready to prove \Cref{thm:main}.

\begin{proof}
Without loss of generality, let $r_a$ be the founder player that opens a new representative $a$ with the hypothesis $\hat{h}_a$ trained over the founder $r_a$. 

**Founder Quality.** The standard realizable VC bound with $m_f = c_1 \cdot (d + \log(2n / \delta) / \epsilon)$ implies $\varepsilon_i (\hat{h}) \leq \epsilon/8$ with failure probability at most $\delta / (2n)$. Applying union bound over $\hat{k} \leq k \leq n$ founder calls indicates that every opened representative satisfies 
$$
\varepsilon_{r_a} (\hat{h}_a) \leq \frac{\epsilon}{8}
$$
with probability at least $1 - \delta / 2$.

**Validation Correctness.** Fix a player-representative pair $(i, a)$, we first show that, with high probability, a player will be merged to a matching representative if its population error is less than $\epsilon / 4$, i.e., 
$$
\varepsilon_i(\hat{h}_a) \leq \epsilon / 4 \implies \hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2. 
$$
Recall $\hat{\varepsilon}_{S_i} (\hat{h}_a) = \frac{1}{m_v} \sum_{s=1}^{m_v} Z_s$, where $Z_s = \mathbf{1}[\hat{h}_a (x_s) \neq y_s] \sim \mathrm{Bernoulli}(p)$. Take $q = \epsilon / 2$ and apply \Cref{lemma:chernoff}, we have 
$$
\Pr \left[ \hat{\varepsilon}_{S_i} (\hat{h}_a) \geq \frac{\epsilon}{2} \right] \leq \exp \left( - D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \frac{\epsilon}{4} \right) m_v \right).
$$
It is easy to see that $D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \frac{\epsilon}{4} \right) = \Omega(\epsilon)$, thus $\Pr \left[ \hat{\varepsilon}_{S_i} (\hat{h}_a) \geq \frac{\epsilon}{2} \right] \leq \exp(-m_v \epsilon)$. 

Similarly, we argue that if $i$ has a high population error, it is unlikely that it will be incorrectly merged, i.e., 
$$
\hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2 \implies \varepsilon_i (\hat{h}_a) \leq \epsilon.
$$
Indeed, according to \Cref{lemma:chernoff},
$$
\Pr \left[ \hat{\varepsilon}_{S_i}(\hat{h}_a) \leq \frac{\epsilon}{2} \right] \leq \exp \left( -D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \epsilon \right) m_v \right),
$$
where $D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \epsilon \right) = \Omega(\epsilon)$, which makes $\Pr \left[ \hat{\varepsilon}_{S_i}(\hat{h}_a) \leq \frac{\epsilon}{2} \right] \leq \exp(-m_v \epsilon)$. 

Together, with $m_v = c_2 \cdot \frac{\log(n^2 / \delta)}{\epsilon}$, $\exp(-m_v \epsilon) \leq \frac{\delta}{4n^2}$ and $\frac{\delta}{4n^2} + \frac{\delta}{4n^2} = \frac{\delta}{2n^2}$. Moreover, there are at most $n^2$ player-representative pairs ($n$ players with at most $n$ representatives). By a union bound, 
$$
\Pr \left[ \exists \mathrm{validation \; pair \; fails} \right] \leq n^2 \cdot \frac{\delta}{2n^2} = \frac{\delta}{2}. 
$$
**At most $k$ representatives.** Consider the moment when player $i$ is processed. Suppose that some earlier founder $r_a$, with the corresponding $\hat{h}_a$, from the same true cluster has already been established, i.e., $\sigma^\star (r_a) = \sigma^\star(i) \implies \mathcal{H} \Delta \mathcal{H} (P_i, P_{r_a}) \leq \tau$. Recall $\varepsilon_{r_a} (\hat{h}_a) \leq \epsilon / 8$, the domain adaptation inequality shown in \Cref{lemma:doamin_adapt_decompose} implies that 
$$
\varepsilon_i (\hat{h}_a) \leq \varepsilon_{r_a} (\hat{h}_a) + \frac{1}{2} \mathcal{H} \Delta \mathcal{H} (P_i, P_{r_a}) + \lambda_{ir_a} \leq \frac{\epsilon}{8} + \frac{\tau}{2}.
$$
Taking $\tau \leq \epsilon / 4$, we have $\varepsilon_i (\hat{h}_a) \leq \epsilon / 4 \implies \hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2$, which implies that player $i$ will successfully pass the validation test and be merged into cluster $a$. Therefore, player $i$ cannot open a new representative, and, in turn, no true cluster is charged twice. Since there are at most $k$ true clusters, the algorithm opens at most $k$ representatives. 

**Sample Complexity.** In summary, each player draws one validation sample of size $m_v$, and each representative founder, at most $k$ representatives, draws a founder sample of size $m_f$. Together, the sample complexity is bounded by 
$$
n m_v + k m_f = \mathcal{O} \left( \frac{k(d + \log (n / \delta)) + n \log(n^2 / \delta)}{\epsilon} \right).
$$

Finally, the runtime consists of at most $k$ ERM calls on hypothesis class $\mathcal{F}$ and at most $nk$ hypothesis evaluations on validation samples on the good event. 
\end{proof}

# Online Smoothness Verification
As introduced in \Cref{lemma:empirical_h_divergence}, the smoothness assumption can be verified by estimating the $\mathcal{H}$-divergence using unlabeled data. Here, we integrate this verification step into Greedy Merging and propose \Cref{alg:online-smooth-greedy}. For each player, the algorithm first draws an unlabeled sample and uses it to certify whether the player is close to an existing founder in $\mathcal{H}\Delta\mathcal{H}$-divergence. Only representatives that pass this smoothness gate are then evaluated on the labeled validation sample. If no representative passes both tests, the player opens a new representative; creating more than $k$ representatives implies that the smoothness assumption does not hold. Thus \Cref{alg:online-smooth-greedy} reject and halt when it detects more than $k$ representatives.

\begin{algorithm}
\caption{Greedy Merging with Online Smoothness Verification}
\label{alg:online-smooth-greedy}
\begin{algorithmic}[1]
\State $m_f \gets c_1 \cdot \frac{d + \log (2n / \delta)}{\epsilon}$
\State $m_v \gets c_2 \cdot \frac{\log(n^2 / \delta)}{\epsilon}$
\State $m_u \gets c_3 \cdot \frac{d + \log(n^2 / \delta)}{\tau^2}$
\State $\delta_u \gets \frac{\delta}{2n^2}$
\State $\beta_u \gets 4\sqrt{\frac{d\log(2m_u)+\log(2/\delta_u)}{m_u}}$
\State Initialize $\hat{\sigma}: [n] \rightarrow \mathbb{N}$
\State $R \gets \emptyset$
\For{each player $i = 1, 2, \dots, n$}
    \State $S_i \sim D_i^{m_v}$ \Comment{fresh labeled validation sample}
    \State $U_i \sim P_i^{m_u}$ \Comment{fresh unlabeled sample}
    \State $\mathrm{assigned} \gets \mathrm{false}$
    \For{each $(\hat{h}_a, a, r_a, U_{r_a}) \in R$}
        \State $\hat{d}_{i r_a} \gets \widehat d_{\mathcal H\Delta\mathcal H}(U_i,U_{r_a})$
        \State $\overline d_{i r_a} \gets \hat{d}_{i r_a} + \beta_u$
        \If{$\overline d_{i r_a} > 2\tau$}
            \State Continue \Comment{smoothness not certified}
        \EndIf
        \If{$\operatorname{err}_{S_i}(\hat{h}_a) \leq \frac{1}{2}\epsilon$}
            \State $\hat{\sigma}(i) \gets a$
            \State $\mathrm{assigned} \gets \mathrm{true}$
            \State Break
        \EndIf
    \EndFor
    \If{$\mathrm{assigned} = \mathrm{false}$}
        \If{$|R| = k$}
            \State Return $-1$ \Comment{smoothness assumption does not hold}
        \EndIf
        \State $a_{\mathrm{new}} \gets \mathrm{fresh\;index}$
        \State $\hat{\sigma}(i) \gets a_{\mathrm{new}}$
        \State $Q_i \sim D_i^{m_f}$
        \State $\hat{h}_{a_{\mathrm{new}}} \gets \mathrm{ERM}_{\mathcal F}(Q_i)$
        \State add $\left(\hat{h}_{a_{\mathrm{new}}}, a_{\mathrm{new}}, i, U_i\right)$ to $R$
    \EndIf
\EndFor
\State Return $\hat{f}_i \gets \hat{h}_{\hat{\sigma}(i)}$ for all $i \in [n]$
\end{algorithmic}
\end{algorithm}

Compared with \Cref{alg:main}, \Cref{alg:online-smooth-greedy} preserves the same labeled sample complexity: each player still draws only one labeled validation sample, and only the at most $k$ founders draw the larger ERM sample. The only additional cost is an unlabeled sample from each player for online $\mathcal{H}\Delta\mathcal{H}$-divergence estimation. Since unlabeled examples are typically much cheaper than labeled examples, this gives a lightweight way to certify the smoothness condition without increasing the labeled sample complexity. As the proof process is similar to the proof of \Cref{thm:main}, we just provide a proof sketch below for simplicity.

\begin{theorem}
\label{thm:online_verification}
Fix $\epsilon,\delta\in(0,1)$ and suppose $\tau \leq \epsilon/4$.
For sufficiently large constants $c_1,c_2,c_3$, with probability at least $1-\delta$, if \Cref{alg:online-smooth-greedy} does not reject, then it returns at most $k$ representatives and satisfies
$$
\varepsilon_i(\hat f_i)\le \epsilon,\quad \forall i\in[n].
$$
with a labeled sample complexity of
$$
\mathcal{O}\left(\frac{k(d+\log(n/\delta))+n\log(n^2/\delta)}{\epsilon}\right)=\tilde{\mathcal{O}}\left(kd + n \right)
$$
and an unlabeled sample complexity of
$$
\mathcal{O}\left(\frac{n(d+\log(n^2/\delta))}{\tau^2}\right) = \tilde{\mathcal{O}} (nd).
$$
\end{theorem}

\begin{proof}[Proof sketch]
The proof follows the same events as \Cref{thm:main}, plus one online divergence event. First, the realizable VC bound and a union bound over all possible founders imply that every opened representative satisfies
$$
\varepsilon_{r_a}(\hat h_a)\le \epsilon/8
$$
with high probability.

Second, the Chernoff validation argument implies that all validation tests are simultaneously correct. In particular, whenever player $i$ accepts representative $\hat h_a$, we have
$$
\varepsilon_i(\hat h_a)\le \epsilon.
$$
Third, by \Cref{lemma:h_divergence_inequality}, every online smoothness estimate satisfies
$$
d_{\mathcal{H}\Delta\mathcal{H}}(P_i,P_{r_a})\le \hat d_{\mathcal{H}\Delta\mathcal{H}}(U_i,U_{r_a})+\beta_u=\overline d_{i r_a}
$$
with high probability.

Thus, every accepted transfer is certified before it is used. Therefore, if player $i$ is assigned to an existing representative, validation gives $\varepsilon_i(\hat f_i)\le \epsilon$. If $i$ opens a new representative, founder quality gives $\varepsilon_i(\hat f_i)\le \epsilon/8\le \epsilon$.

The algorithm outputs at most $k$ representatives because it rejects rather than opening a $(k+1)$-st representative. The labeled sample complexity is
$$
N_\ell \leq n m_v + k m_f=\mathcal{O}\left(\frac{k(d+\log(n/\delta))+n\log(n^2/\delta)}{\epsilon}\right),
$$
and the unlabeled sample complexity is
$$
N_u=n m_u=\mathcal{O}\left(\frac{n(d+\log(n^2/\delta))}{\tau^2}\right).
$$
A union bound over the good events gives probability at least $1-\delta$.
\end{proof}


\printbibliography
