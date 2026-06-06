---
title: 平滑性假设下的高效协作学习
date: 2026-06-04
lang: zh
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



# 引言
PAC 学习 \citep{V1984,BEHW1989} 为研究一个假设类何时能够从有限数量的有标签样本中被学习，并且具有可证明的准确率和置信度保证，提供了一个基础性的理论框架。在经典设定中，学习器观察来自单个分布的有标签样本，并使用这些样本上的经验误差作为真实总体误差的代理。其核心问题是 <u>一个在经验上表现良好的预测器是否也能泛化到未见数据，以及需要多少有标签样本才能以高概率保证这一点</u>。

协作 PAC 学习 \citep{BHPQ2017} 将这一视角扩展到 <u>多分布</u> 设定中，其中不同的参与方可能具有不同的数据分布，但学习目标是集体性的：通过使用来自所有参与方的样本，算法应当为所有参与方返回准确的预测器，同时保持较低的总有标签样本复杂度。

\citet{DQ2024} 的近期工作进一步研究了具有异质标注函数的协作 PAC 学习。具体来说，不同参与方不再由同一个共享目标函数支配，而是可能遵循不同的标注规则，并且所有参与方被假设可以划分为少量潜在学习任务。然而，\citet{DQ2024} 表明，仅有这种异质性本身并不能保证高效协作学习：如果没有额外假设，将参与方最优划分到潜在任务中是 <u>NP-hard</u> 的，这使得对应的学习问题在一般情况下计算上不可处理。这促使我们寻找自然的结构性假设，使得具有低有标签样本复杂度的高效协作 PAC 学习成为可能。

本文关注一个经典且直观的答案：<u>平滑性假设</u>。粗略地说，如果两个参与方属于同一个潜在任务，那么它们的边缘分布不应当相距任意远。如果一个在某个参与方上训练得到的模型在那里表现良好，并且另一个参与方看到的分布足够相似，那么同一个模型也应当在第二个参与方上表现得足够好。这类假设在机器学习中非常常见。例如，在半监督学习中，平滑性假设、聚类假设和流形假设通常被用来连接边缘分布的几何结构与标注函数的行为：相近的点、位于同一高密度区域中的点，或者位于同一低维流形上的点，被期望具有相似的标签 \citep{CSZ2006,R2007,BNS2006}。类似地，在非参数回归中，经典的 Lipschitz 平滑性假设形式化了这样一种想法：输入的微小变化不应导致目标函数发生很大变化 \citep{S1982}。我们使用领域自适应理论中的工具，特别是边缘分布之间的 $H\Delta H$-divergence，来为协作 PAC 学习形式化一种类似的直觉 \citep{BDBC2010}。

# 问题设定
我们采用如下二分类标准模型：假设类 $\mathcal{F}\subseteq \{ 0, 1 \}^{\mathcal{X}}$ 是定义在实例空间（$\mathcal{X}$）上的二值函数族，其 VC 维度为 $d$。数据分布 $\mathcal{D}$ 是定义在 $\mathcal{X} \times \{ 0, 1\}$ 上的分布。函数 $f: \mathcal{X} \to \{ 0, 1 \}$ 在数据分布 $\mathcal{D}$ 上的总体误差定义为
$$
\varepsilon(f)\coloneqq \Pr_{(x,y)\sim D_i}[f(x)\neq y].
$$
类似地，给定一个包含有限样本的数据集，即 $S = \{(x_i, y_i)\}_{i \in [m]}$，$f$ 的训练（经验）误差定义为
$$
\hat{\varepsilon}(f) \coloneqq \frac{1}{m} \sum_{i=1}^m \mathbf{1} \{ f(x_i) \neq y_i \}.
$$ 

## 协作学习
学习算法可以访问 $n$ 个数据分布 $\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n$ 的样本。在每一步中，算法可以选择这 $n$ 个分布中的一个并从中抽取一个样本。学习算法的目标是为每个任务 $i \in [n]$ 输出一个假设 $\hat{f}_i$，使得
$$
\Pr \left[ \varepsilon_i(\hat f_i)\le \epsilon,  \forall i \in [n] \right] \geq 1 - \delta,
$$
同时尽可能少地使用有标签样本。这也被称为 $(\epsilon, \delta)$-PAC。

### 已有结果
在经典（非协作）PAC 学习中，众所周知，抽取大小为
$$
\mathcal{O} \left( \frac{1}{\epsilon} \left( d \ln \frac{1}{\epsilon} + \ln \frac{1}{\delta}\right) \right) = \tilde{\mathcal{O}}(d),
$$
的样本集 $S$，足以在给定一个 VC 维度为 $d$ 的假设类 $\mathcal{F}$ 时学习到一个满足 $(\epsilon, \delta)$-PAC 的假设 \citep{AB2009}。

在协作设定中，容易看出，朴素地独立训练 $n$ 个分布会给出
$$
\tilde{\mathcal{O}}(nd)
$$
的样本复杂度。\citet{BHPQ2017} 在所有分布都承认同一个标注函数的可实现假设下，引入了一个样本高效的算法。具体来说，\citet{BHPQ2017} 达到了
$$
\mathcal{O} \left( \frac{\ln n}{\epsilon} \left( (d+n) \ln \frac{1}{\epsilon} + n \ln \frac{n}{\delta} \right) \right) = \tilde{\mathcal{O}}(d + n).
$$
的样本复杂度。

当考虑异质标注函数时，在标准可实现性假设之外，\citet{DQ2024} 定义了如下所示的 $(k, \epsilon)$-realizablity：

\begin{definition}[$(k, \epsilon)$-realizablity]
\label{def:k_eps_realizability}
如果存在 $f_1^\star, \dots, f_k^\star \in \mathcal{F}$ 和 $\sigma^\star:[n]\to[k]$，使得对于每个 $i\in[n]$ 都有 $\varepsilon_i(f^\star_{\sigma^\star(i)})=0$，则称分布 $\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n$ 关于假设类 $\mathcal{F}$ 是 $(k, \epsilon)$-realizable 的。
\end{definition}

\Cref{def:k_eps_realizability} 保证我们可以在 $\mathcal{F}$ 中找到 $k$ 个分类器，使得在每个分布上，至少有一个分类器的总体误差低于 $\epsilon$。在这样的假设下，\citet{DQ2024} 给出了一个学习算法，其以
$$
\mathcal{O} \left( \frac{k d \log(n/k)\log(1/\epsilon)}{\epsilon} + \frac{n\log k \log(1/\epsilon) + n\log(n/\delta)}{\epsilon} \right) = \tilde{\mathcal{O}} (kd + n).
$$
的样本复杂度达到 $(8\epsilon, \delta)$-PAC。然而，\citet{DQ2024} 进一步表明，即使在通常的 PAC 学习设定中存在针对 $\mathcal{F}$ 的计算高效学习器，该学习算法也可能不是计算高效的。为了绕开这一点，\citet{DQ2024} 考虑了一个特殊情况：所有 $n$ 个分布在 $\mathcal{X}$ 上共享相同的边缘分布，并提出了一个样本复杂度为
$$
\mathcal{O} \left( \frac{kd \log(1 / \epsilon)}{\epsilon} + \frac{n \log (n / \delta)}{\epsilon} \right) = \tilde{\mathcal{O}} (kd + n).
$$
的高效算法。在本文中，我们仔细论证这种特殊情况可能过于悲观，并且所提出的算法框架可以推广到一个更弱的平滑性假设：只有共享同一个 $\mathcal{Y}$ 空间的分布具有相似的边缘分布；而其他分布可以具有（显著）不同的边缘分布。

## 平滑性假设
我们使用的关键结构性假设是边缘分布上的任务内平滑性假设。直观地说，如果两个参与方属于同一个潜在学习任务，那么它们的输入不应来自实例空间中完全无关的区域。沿用 \citet{BDBC2010}，我们使用 $\mathcal{H}$-divergence 来度量边缘分布之间的差异，其方式是询问给定假设类中的某个分类器能否区分来自两个领域的样本。

\begin{definition}[$\mathcal{H}$-divergence]
\label{define:H_Delta_H}
对于 $\mathcal{X}$ 上的两个分布 $P, Q$，令 $\mathcal{H}$ 为一个假设类，并用 $I(h)$ 表示使得 $h \in \mathcal{H}$ 为其特征函数的集合，即 $x \in I(h) \iff h(x) = 1$，则
\[
d_{\mathcal{H}} (P, Q) = 2 \sup_{h \in \mathcal{H}} \left| \Pr_P (I(h)) - \Pr_{Q} [I(h)] \right|.
\]
\end{definition}

\citet{BDBC2010} 进一步提出了一些有用工具，可以仅使用 <u>无标签数据</u> 来经验估计这种 $\mathcal{H}$-divergence，这使得平滑性假设能够以较低成本被轻松验证。

\begin{lemma}
\label{lemma:empirical_h_divergence}
对于一个对称假设类 $\mathcal{H}$（即对每个 $h \in \mathcal{H}$，其反假设 $1-h$ 也在 $\mathcal{H}$ 中）以及大小为 $m$ 的样本 $\mathcal{U}_P,\mathcal{U}_Q$，
$$
\hat{d}_{\mathcal{H}}(P, Q) = 2\left(1-\min_{h \in \mathcal{H}}\left[\frac{1}{m}\sum_{\mathbf{x}:h(\mathbf{x})=0} I[\mathbf{x}\in \mathcal{U}_P] + \frac{1}{m}\sum_{\mathbf{x}:h(\mathbf{x})=1} I[\mathbf{x}\in \mathcal{U}_Q]\right]\right),
$$ 
其中 $I[\mathbf{x}\in\mathcal{U}]$ 是二值指示变量，当 $\mathbf{x}\in\mathcal{U}$ 时取值为 $1$。
\end{lemma}
\begin{lemma}
\label{lemma:h_divergence_inequality}
令 $\mathcal{H}$ 为 $\mathcal{X}$ 上 VC 维度为 $d$ 的假设空间。如果
$$
\mathcal{U}_P = \{ x_1, \dots, x_m \} \sim Q^m; \mathcal{U}_Q = \{ x'_1, \dots, x'_m \} \sim Q^m
$$  
分别是来自 $P$ 和 $Q$ 的大小为 $m$ 的无标签样本，并且 $\hat{d}_{\mathcal{H}}(P, Q)$ 是样本之间的经验 $\mathcal{H}$-divergence，那么对于任意 $\delta \in (0,1)$，以至少 $1-\delta$ 的概率，
$$
d_{\mathcal{H}}(P,Q) \le \hat{d}_{\mathcal{H}}(P,Q) + 4\sqrt{ \frac{ d\log(2m)+\log\left(\frac{2}{\delta}\right) }{m}}.
$$
\end{lemma}
简言之，\Cref{lemma:empirical_h_divergence} 表明估计 $\mathcal{H}$-divergence 可以被归约为一个二分类的领域分类问题：如果 $\mathcal{H}$ 中没有任何分类器能够可靠地区分一个无标签样本来自 $P$ 还是 $Q$，那么这两个边缘分布相对于 $\mathcal{H}$ 是接近的。\Cref{lemma:h_divergence_inequality} 进一步意味着，在 $m$ 足够大时，经验 $\mathcal{H}$-divergence 可以被直接用于估计真实的 $\mathcal{H}$-divergence。

本文使用的另一个关键定义，同样改编自 \citet{BDBC2010}，是假设空间 $\mathcal{H}$ 的对称差假设空间 $\mathcal{H} \Delta \mathcal{H}$。

\begin{definition}[$\mathcal{H} \Delta \mathcal{H}$]
\label{def:h_delta_h}
对于一个假设空间 $\mathcal{H}$，对称差假设空间 $\mathcal{H}\Delta \mathcal{H}$ 是如下假设的集合：
$$
g \in \mathcal{H} \Delta \mathcal{H}
\;\Longleftrightarrow\;
g(\mathbf{x}) = h(\mathbf{x}) \oplus h'(\mathbf{x})
\quad \text{for some } h,h' \in \mathcal{H},
$$
其中 $\oplus$ 是 XOR 函数。
\end{definition}

# 高效协作学习算法
现在我们可以给出形式化假设，以及一个能够以低样本复杂度达到协作 $(\epsilon, \delta)$-PAC 的高效算法。

\begin{assumption}
\label{asm:main_asm}
实例 $(\mathcal{F},\mathcal{D}_1, \mathcal{D}_2, \dots, \mathcal{D}_n)$ 满足如下条件。
  - **$(k,0)$-realizable.**

  - **Smoothness Assumption.** 对于每一对满足 $\sigma^\star(i)=\sigma^\star(j)$ 的 $i, j$：$\mathcal{H} \Delta \mathcal{H} (\mathcal{D}_i,\mathcal{D}_j) \leq \tau$。

  我们始终假设 $\tau \leq c_{\tau} \epsilon$，其中 $c_{\tau}$ 是一个足够小的绝对常数。
\end{assumption}
\begin{remark}
虽然我们在 \Cref{asm:main_asm} 中假设 $(k, 0)$-realizability，但我们认为它可以很容易地扩展到 $(k, \epsilon)$-realizability，这会将 \Cref{thm:main} 中的协作 PAC 保证放宽为 $(c \cdot \epsilon, \delta)$-PAC，其中常数因子会被 big-O 记号吸收。
\end{remark}

基于 \Cref{asm:main_asm}，我们提出一个简单算法，即 \Cref{alg:main} 中所示的 Greedy Merging。一般来说，该算法维护一个代表列表 $R = \{ (\hat{h}_a, a): a \in [\hat{k}] \}$。对于每个新参与方，算法抽取一个新的验证样本，用来检查是否存在一个合适的代表。如果没有任何代表通过验证，那么该参与方通过抽取一个更大的 founder 样本并拟合新的代表假设来开启一个新的代表。在 \Cref{asm:main_asm} 下，我们认为 Greedy Merging 具有多项式运行时间，并且会形成至多 $\hat{k} \leq k$ 个簇，从而带来较低的样本复杂度。

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
固定 $\epsilon,\delta \in (0,1)$。在 \Cref{asm:main_asm} 下，当 $c_1$ 和 $c_2$ 足够大时，\Cref{alg:main} 满足 $\Pr \left[ \varepsilon_i(\hat f_i)\le \epsilon,  \forall i \in [n] \right] \geq 1 - \delta$，并且样本复杂度为
$$
\mathcal{O} \left( \frac{k(d + \log (n / \delta) + n \log (n^2 / \delta))}{\epsilon} \right) = \tilde{\mathcal{O}} \left( kd + n \right).
$$
\end{theorem}

\Cref{thm:main} 的证明基于标准 Chernoff bound（在 \Cref{lemma:chernoff} 中正式陈述）以及 \citet{BDBC2010} 提出的一个领域自适应不等式（在 \Cref{lemma:doamin_adapt_decompose} 中正式陈述）。

\begin{lemma}[Chernoff-Bounds]
\label{lemma:chernoff}
令 $X_1,\ldots,X_n$ 为独立随机变量，其中对 $i=1,\ldots,n$ 有 $X_i \in \{0,1\}$ 且 $\Pr[X_i=1]=p$。令 $X := \sum_{i=1}^n X_i$。那么，对任意 $t \in [0,1-p]$，我们有
$$
\Pr[X \ge (p+t)n] \leq \exp({-D_{\mathrm{KL}}(p+t \| p)n}).
$$
\end{lemma}
\begin{lemma}
\label{lemma:doamin_adapt_decompose}
对于任意 $\delta \in (0, 1)$，以至少 $1 - \delta$ 的概率（概率取于样本的选择），对每个 $h \in \mathcal{H}$：
$$
\varepsilon_j (h) \leq \varepsilon_i (h) + \frac{1}{2} \mathcal{H} \Delta \mathcal{H} (P_i, P_j) + \lambda_{ij},
$$
其中 $\lambda_{ij} = \min_{h' \in \mathcal{H}} \left[ \varepsilon_i (h') + \varepsilon_j (h') \right]$。
\end{lemma}

现在我们准备证明 \Cref{thm:main}。

\begin{proof}
不失一般性，令 $r_a$ 为开启新代表 $a$ 的 founder player，并令 $\hat{h}_a$ 为在 founder $r_a$ 上训练得到的假设。

**Founder 质量。** 标准可实现 VC bound 与 $m_f = c_1 \cdot (d + \log(2n / \delta) / \epsilon)$ 意味着 $\varepsilon_i (\hat{h}) \leq \epsilon/8$，其失败概率至多为 $\delta / (2n)$。对 $\hat{k} \leq k \leq n$ 次 founder 调用应用 union bound，说明每个被开启的代表都满足
$$
\varepsilon_{r_a} (\hat{h}_a) \leq \frac{\epsilon}{8}
$$
的概率至少为 $1 - \delta / 2$。

**验证正确性。** 固定一个参与方-代表对 $(i, a)$，我们首先证明，以高概率，如果一个参与方在该代表假设下的总体误差小于 $\epsilon / 4$，那么它会被合并到一个匹配的代表中，即
$$
\varepsilon_i(\hat{h}_a) \leq \epsilon / 4 \implies \hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2. 
$$
回忆 $\hat{\varepsilon}_{S_i} (\hat{h}_a) = \frac{1}{m_v} \sum_{s=1}^{m_v} Z_s$，其中 $Z_s = \mathbf{1}[\hat{h}_a (x_s) \neq y_s] \sim \mathrm{Bernoulli}(p)$。取 $q = \epsilon / 2$ 并应用 \Cref{lemma:chernoff}，我们有
$$
\Pr \left[ \hat{\varepsilon}_{S_i} (\hat{h}_a) \geq \frac{\epsilon}{2} \right] \leq \exp \left( - D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \frac{\epsilon}{4} \right) m_v \right).
$$
容易看出 $D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \frac{\epsilon}{4} \right) = \Omega(\epsilon)$，因此 $\Pr \left[ \hat{\varepsilon}_{S_i} (\hat{h}_a) \geq \frac{\epsilon}{2} \right] \leq \exp(-m_v \epsilon)$。

类似地，我们认为如果 $i$ 具有较高的总体误差，那么它不太可能被错误合并，即
$$
\hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2 \implies \varepsilon_i (\hat{h}_a) \leq \epsilon.
$$
事实上，根据 \Cref{lemma:chernoff}，
$$
\Pr \left[ \hat{\varepsilon}_{S_i}(\hat{h}_a) \leq \frac{\epsilon}{2} \right] \leq \exp \left( -D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \epsilon \right) m_v \right),
$$
其中 $D_{\mathrm{KL}} \left( \frac{\epsilon}{2} \| \epsilon \right) = \Omega(\epsilon)$，这使得 $\Pr \left[ \hat{\varepsilon}_{S_i}(\hat{h}_a) \leq \frac{\epsilon}{2} \right] \leq \exp(-m_v \epsilon)$。

合在一起，当 $m_v = c_2 \cdot \frac{\log(n^2 / \delta)}{\epsilon}$ 时，$\exp(-m_v \epsilon) \leq \frac{\delta}{4n^2}$ 且 $\frac{\delta}{4n^2} + \frac{\delta}{4n^2} = \frac{\delta}{2n^2}$。此外，参与方-代表对至多有 $n^2$ 个（$n$ 个参与方和至多 $n$ 个代表）。由 union bound，
$$
\Pr \left[ \exists \mathrm{validation \; pair \; fails} \right] \leq n^2 \cdot \frac{\delta}{2n^2} = \frac{\delta}{2}. 
$$
**至多 $k$ 个代表。** 考虑参与方 $i$ 被处理的时刻。假设已经存在来自同一个真实簇的某个更早 founder $r_a$ 及其对应的 $\hat{h}_a$，即 $\sigma^\star (r_a) = \sigma^\star(i) \implies \mathcal{H} \Delta \mathcal{H} (P_i, P_{r_a}) \leq \tau$。回忆 $\varepsilon_{r_a} (\hat{h}_a) \leq \epsilon / 8$，\Cref{lemma:doamin_adapt_decompose} 中给出的领域自适应不等式意味着
$$
\varepsilon_i (\hat{h}_a) \leq \varepsilon_{r_a} (\hat{h}_a) + \frac{1}{2} \mathcal{H} \Delta \mathcal{H} (P_i, P_{r_a}) + \lambda_{ir_a} \leq \frac{\epsilon}{8} + \frac{\tau}{2}.
$$
取 $\tau \leq \epsilon / 4$，我们有 $\varepsilon_i (\hat{h}_a) \leq \epsilon / 4 \implies \hat{\varepsilon}_{S_i} (\hat{h}_a) \leq \epsilon / 2$，这意味着参与方 $i$ 会成功通过验证测试并被合并到簇 $a$ 中。因此，参与方 $i$ 不能开启一个新代表，进而没有真实簇会被计费两次。由于真实簇至多有 $k$ 个，算法至多开启 $k$ 个代表。

**样本复杂度。** 总结来说，每个参与方抽取一个大小为 $m_v$ 的验证样本，并且每个代表 founder（至多 $k$ 个代表）抽取一个大小为 $m_f$ 的 founder 样本。合在一起，样本复杂度被界定为
$$
n m_v + k m_f = \mathcal{O} \left( \frac{k(d + \log (n / \delta)) + n \log(n^2 / \delta)}{\epsilon} \right).
$$

最后，在 good event 上，运行时间由至多 $k$ 次对假设类 $\mathcal{F}$ 的 ERM 调用，以及至多 $nk$ 次验证样本上的假设评估组成。
\end{proof}

# 在线平滑性验证
如 \Cref{lemma:empirical_h_divergence} 所介绍，平滑性假设可以通过使用无标签数据估计 $\mathcal{H}$-divergence 来验证。在这里，我们将这一验证步骤整合到 Greedy Merging 中，并提出 \Cref{alg:online-smooth-greedy}。对于每个参与方，算法首先抽取一个无标签样本，并用它来认证该参与方是否在 $\mathcal{H}\Delta\mathcal{H}$-divergence 意义下接近某个已有 founder。只有通过该平滑性门控的代表，才会随后在有标签验证样本上被评估。如果没有任何代表同时通过两个测试，该参与方会开启一个新的代表；创建超过 $k$ 个代表意味着平滑性假设不成立。因此，当 \Cref{alg:online-smooth-greedy} 检测到超过 $k$ 个代表时，它会 reject 并 halt。

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
            \State Return $-1$ \Comment{smoothness assumption not hold}
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

与 \Cref{alg:main} 相比，\Cref{alg:online-smooth-greedy} 保持了相同的有标签样本复杂度：每个参与方仍然只抽取一个有标签验证样本，并且只有至多 $k$ 个 founder 会抽取更大的 ERM 样本。唯一额外的成本是从每个参与方抽取一个无标签样本，用于在线估计 $\mathcal{H}\Delta\mathcal{H}$-divergence。由于无标签样本通常比有标签样本便宜得多，这提供了一种轻量级方式来认证平滑性条件，同时不增加有标签样本复杂度。由于证明过程与 \Cref{thm:main} 的证明类似，为简洁起见，我们只在下面给出 proof sketch。

\begin{theorem}
\label{thm:online_verification}
固定 $\epsilon,\delta\in(0,1)$ 并假设 $\tau \leq \epsilon/4$。对于足够大的常数 $c_1,c_2,c_3$，以至少 $1-\delta$ 的概率，如果 \Cref{alg:online-smooth-greedy} 不 reject，那么它返回至多 $k$ 个代表并满足
$$
\varepsilon_i(\hat f_i)\le \epsilon,\quad \forall i\in[n].
$$
其有标签样本复杂度为
$$
\mathcal{O}\left(\frac{k(d+\log(n/\delta))+n\log(n^2/\delta)}{\epsilon}\right)=\tilde{\mathcal{O}}\left(kd + n \right)
$$
无标签样本复杂度为
$$
\mathcal{O}\left(\frac{n(d+\log(n^2/\delta))}{\tau^2}\right) = \tilde{\mathcal{O}} (nd).
$$
\end{theorem}

\begin{proof}[Proof sketch]
证明遵循与 \Cref{thm:main} 相同的 good events，并额外加入一个在线 divergence 事件。首先，可实现 VC bound 以及对所有可能 founder 的 union bound 意味着，每个被开启的代表都以高概率满足
$$
\varepsilon_{r_a}(\hat h_a)\le \epsilon/8
$$
。

其次，Chernoff 验证论证意味着所有验证测试同时正确。特别地，每当参与方 $i$ 接受代表 $\hat h_a$ 时，我们都有
$$
\varepsilon_i(\hat h_a)\le \epsilon.
$$
第三，由 \Cref{lemma:h_divergence_inequality}，每个在线平滑性估计都以高概率满足
$$
d_{\mathcal{H}\Delta\mathcal{H}}(P_i,P_{r_a})\le \hat d_{\mathcal{H}\Delta\mathcal{H}}(U_i,U_{r_a})+\beta_u=\overline d_{i r_a}
$$
。

因此，每次被接受的 transfer 在被使用前都已经被认证。因此，如果参与方 $i$ 被分配给一个已有代表，验证会给出 $\varepsilon_i(\hat f_i)\le \epsilon$。如果 $i$ 开启一个新代表，founder quality 给出 $\varepsilon_i(\hat f_i)\le \epsilon/8\le \epsilon$。

该算法输出至多 $k$ 个代表，因为它会 reject 而不是开启第 $(k+1)$ 个代表。有标签样本复杂度为
$$
N_\ell \leq n m_v + k m_f=\mathcal{O}\left(\frac{k(d+\log(n/\delta))+n\log(n^2/\delta)}{\epsilon}\right),
$$
无标签样本复杂度为
$$
N_u=n m_u=\mathcal{O}\left(\frac{n(d+\log(n^2/\delta))}{\tau^2}\right).
$$
对这些 good events 使用 union bound 即得到概率至少为 $1-\delta$。
\end{proof}


\printbibliography
